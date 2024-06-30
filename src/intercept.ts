import { BatchInterceptor, Interceptor } from "@mswjs/interceptors"
import { FetchInterceptor } from "@mswjs/interceptors/fetch"
import * as jsEnv from "browser-or-node"
import { ResolvedAppearConfig } from "./config"
import { process } from "./process"
import { Operation } from "./report"

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

export async function intercept(
  config: ResolvedAppearConfig,
  onOperation: (operation: Operation) => void,
) {
  const interceptors: Interceptor<any>[] = [new FetchInterceptor()]

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

  return {
    stop: () => {
      interceptor.removeAllListeners()
      interceptor.dispose()
    },
  }
}
