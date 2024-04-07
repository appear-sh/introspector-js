import { BatchInterceptor, Interceptor } from "@mswjs/interceptors"
import { FetchInterceptor } from "@mswjs/interceptors/fetch"
import * as jsEnv from "browser-or-node"
import { ResolvedAppearConfig } from "./config"
import { schemaFromValue } from "./contentTypes/contentTypes"
import { isNonNullable } from "./helpers"
import { DEFAULT_REPORTING_ENDPOINT, Operation } from "./report"

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

const getBodySchema = async (input: Request | Response) => {
  const clone = input.clone()
  if (!clone.body) return null

  const contentMediaType = clone.headers
    .get("content-type")
    ?.toLowerCase()
    ?.split(";")[0]
    ?.trim()

  if (/application\/(?:.*\+)?json/.test(contentMediaType ?? "")) {
    // application/json;
    // application/something+json;
    // application/vnd.something-other+json;
    const contentSchema = schemaFromValue(await clone.json(), "in:body")
    if (!contentSchema) return null
    return {
      type: "string" as const,
      contentSchema,
      contentMediaType: contentMediaType!,
    }
  } else if (/application\/(?:.*\+)?xml/.test(contentMediaType ?? "")) {
    // application/xml;
    // application/something+xml;
    // application/vnd.something-other+xml;
    // todo add xml parsing
    return { type: "string" as const, contentMediaType: contentMediaType! }
  } else if (contentMediaType?.includes("text/")) {
    return { type: "string" as const, contentMediaType: contentMediaType! }
  }
  // todo add other types

  // unknown type
  return null
}

const convertToOperation = async (
  req: Request,
  res: Response,
): Promise<Operation> => {
  const requestBody = await getBodySchema(req)
  const responseBody = await getBodySchema(res)

  const requestHeadersSchemaEntries = [...req.headers.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:header")
      return schema ? [name, schema] : undefined
    })
    .filter(isNonNullable)

  const responseHeadersSchemaEntries = [...req.headers.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:header")
      return schema ? [name, schema] : undefined
    })
    .filter(isNonNullable)

  const query = [...new URL(req.url, "http://localhost").searchParams.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:query")
      return schema ? [name, schema] : undefined
    })
    .filter(isNonNullable)

  return {
    request: {
      method: req.method,
      uri: req.url.split("?")[0]!, // remove query so we don't send raw values
      headers: Object.fromEntries(requestHeadersSchemaEntries),
      query: Object.fromEntries(query),
      body: requestBody,
    },
    response: {
      headers: Object.fromEntries(responseHeadersSchemaEntries),
      statusCode: res.status,
      body: responseBody,
    },
  }
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

    const operation = await convertToOperation(request, response)
    onOperation(operation)
  })

  return {
    stop: () => {
      interceptor.removeAllListeners()
      interceptor.dispose()
    },
  }
}
