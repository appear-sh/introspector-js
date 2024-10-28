import { BatchInterceptor, Interceptor } from "@mswjs/interceptors"
import { FetchInterceptor } from "@mswjs/interceptors/fetch"
import * as jsEnv from "browser-or-node"
import EventEmitter from "events"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { ClientRequest, IncomingMessage, ServerResponse } from "http"
import { NodeSDK } from "@opentelemetry/sdk-node"

import { ResolvedAppearConfig } from "./config"
import { process } from "./process"
import { Operation } from "./report"
import {
  incomingMessageToRequest,
  readBodyFromRequest,
  readBodyFromResponse,
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

  const sdk = new NodeSDK({
    instrumentations: [incomingHTTPInstrumentor],
  })

  sdk.start()

  hookEmiter.on("exit", () => {
    sdk.shutdown()
  })
}

export async function intercept(
  config: ResolvedAppearConfig,
  onOperation: (operation: Operation) => void,
) {
  const interceptors: Interceptor<any>[] = [new FetchInterceptor()]
  const hasDoneInboundHook =
    (globalThis as any)[INTROSPECTOR_HOOKED_SYMBOL] === true

  const hookEmitter = hasDoneInboundHook
    ? (globalThis as any)[INTROSPECTOR_EMITTER_SYMBOL]
    : new EventEmitter()

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

    if (!request) {
      throw new Error("Could not find corresponding request for response.")
    } else {
      requests.delete(requestId)
    }

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
      if (incomingResponse instanceof IncomingMessage) {
        // Ignore.
        return
      }

      const request = await incomingMessageToRequest(incomingResponse.req)
      const response = await serverResponseToResponse(incomingResponse)

      if (!config.interception.filter(request, response, config)) {
        return
      }

      const operation = await process(request, response, config)
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
