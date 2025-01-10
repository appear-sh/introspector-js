import type { IncomingMessage, ServerResponse } from "http"
import EventEmitter from "events"
import nodeProcess from "process"

import { BatchInterceptor, Interceptor } from "@mswjs/interceptors"
import { FetchInterceptor } from "@mswjs/interceptors/fetch"
import * as jsEnv from "browser-or-node"

import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { Sampler, SamplingDecision } from "@opentelemetry/sdk-trace-base"

import { ResolvedAppearConfig } from "./config"
import { process } from "./process"
import { Operation } from "./report"
import {
  getGlobalAppear,
  incomingMessageToRequest,
  serverResponseToResponse,
} from "./helpers"

import {
  INTROSPECTOR_EMITTER_SYMBOL,
  INTROSPECTOR_HOOKED_SYMBOL,
} from "./hook/symbol"

export const defaultInterceptFilter = (
  request: Request,
  response: Response,
  config: ResolvedAppearConfig,
): boolean => {
  // Fetch & XHR don't have set destination
  // Probably something we don't care about, ignore.
  if (request.destination !== "") return false
  // ignore reports to Appear
  if (request.url === config.reporting.endpoint) return false

  return true
}

export async function hookInbound(hookEmiter: EventEmitter) {
  const incomingHTTPInstrumentor = new HttpInstrumentation({
    responseHook: async (
      _: unknown,
      response: IncomingMessage | ServerResponse,
    ) => {
      hookEmiter.emit("response", response)
    },
  })

  if (
    nodeProcess.env.NEXT_RUNTIME == "edge" ||
    nodeProcess.env.NEXT_RUNTIME == "nodejs"
  ) {
    const { registerOTel } = await import("@vercel/otel")
    return registerOTel({
      instrumentations: [incomingHTTPInstrumentor],
      traceSampler: "always_off",
    })
  } else {
    // NextJS does a weird thing where it tries to staticly analyse this
    // file, upfront, and then tries to compile @opentelemetry/sdk-node which
    // doesn't work because some system packages aren't available.
    // Pulling the package name out into a variable avoids this, but DOES mean
    // that a warning of "the request of a dependency is an expression" gets logged.
    // Unfortunate.
    const otelPackageName = "@opentelemetry/sdk-node"
    const { NodeSDK } = await import(otelPackageName)

    // We don't actually want to submit any traces to a potentially non-existant otel collector.
    const sampler: Sampler = {
      shouldSample: () => {
        return {
          decision: SamplingDecision.NOT_RECORD,
        }
      },
    }

    const sdk = new NodeSDK({
      instrumentations: [incomingHTTPInstrumentor],
      sampler,
    })

    sdk.start()

    hookEmiter.on("exit", () => {
      sdk.shutdown()
    })
  }
}

export async function intercept(
  config: ResolvedAppearConfig,
  onOperation: (operation: Operation) => void,
) {
  const interceptors: Interceptor<any>[] = [new FetchInterceptor()]

  const globalAppear = getGlobalAppear()
  const hasDoneInboundHook = globalAppear[INTROSPECTOR_HOOKED_SYMBOL] == true
  const hookEmitter = globalAppear[INTROSPECTOR_EMITTER_SYMBOL]

  if (jsEnv.isBrowser && !config.interception?.disableXHR) {
    const { XMLHttpRequestInterceptor } = await import(
      "@mswjs/interceptors/XMLHttpRequest"
    )
    interceptors.push(new XMLHttpRequestInterceptor())
  }

  if (jsEnv.isNode) {
    const { ClientRequestInterceptor } = await import(
      "@mswjs/interceptors/ClientRequest"
    )
    interceptors.push(new ClientRequestInterceptor())
  }

  const interceptor = new BatchInterceptor({
    name: "appear-introspector",
    interceptors,
  })

  interceptor.apply()

  const requests = new Map<string, Request>()

  // Workaround for https://github.com/mswjs/interceptors/issues/419
  interceptor.on("request", ({ request, requestId }) => {
    requests.set(requestId, request.clone())
  })

  interceptor.on("response", async ({ requestId, response }) => {
    const request = requests.get(requestId)

    // If we don't have the request, we can't do anything.
    // Usually this shouldn't happen, but in theory it could be in case of "response" event fired multiple times, in which case we can ignore it.
    if (!request) return

    // remove from requests in flight
    requests.delete(requestId)

    if (!config.interception.filter(request, response, config)) {
      return
    }

    const operation = await process(request, response, config)
    onOperation(operation)
  })

  // Check if we've already done our inbound hook. If not, do it now.
  // This _probably_ won't hook anything new due to node import
  // priorities, but it's harmless to do so, so we'll do it.
  if (!hasDoneInboundHook) {
    hookInbound(hookEmitter)
  }

  hookEmitter.on(
    "response",
    async (incomingResponse: IncomingMessage | ServerResponse) => {
      // Check if the response is an instance of IncomingMessage.
      // This is a workaround to prevent us from having to import the non-types
      // of node:http, which won't work in some serverless/edge runtimes.
      if (!("assignSocket" in incomingResponse)) {
        return
      }

      // This MUST be in a promise.all, as we need to hook both the
      // request AND the response in the same tick, otherwise we'll miss
      // the events on the body, and we'll end up hanging.
      // TODO: We probably want to race this with a timeout eventually.
      const [parsedRequest, parsedResponse] = await Promise.all([
        incomingMessageToRequest(incomingResponse.req),
        serverResponseToResponse(incomingResponse),
      ])

      if (!config.interception.filter(parsedRequest, parsedResponse, config)) {
        return
      }

      const operation = await process(parsedRequest, parsedResponse, config)
      onOperation(operation)
    },
  )

  return {
    stop: () => {
      interceptor.removeAllListeners()
      interceptor.dispose()
      hookEmitter.emit("exit")
    },
  }
}
