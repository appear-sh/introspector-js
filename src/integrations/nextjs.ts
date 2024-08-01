import { AppearConfig, resolveConfig } from "../config"
import { reporter } from "../report"
import { process } from "../process"
import { waitUntil } from "@vercel/functions"
import type {
  IncomingHttpHeaders,
  IncomingMessage,
  OutgoingHttpHeaders,
  ServerResponse,
} from "node:http"

type Handler = (
  req: IncomingMessage & { body: any },
  res: ServerResponse,
) => void

const normalizeHeaders = (
  headers: IncomingHttpHeaders | OutgoingHttpHeaders,
) => {
  const entries = Object.entries(headers).reduce(
    (acc, [key, value]) => {
      if (typeof value === "string") acc.push([key, value])
      if (typeof value === "number") acc.push([key, value.toString()])
      if (Array.isArray(value)) value.forEach((v) => acc.push([key, v]))
      return acc
    },
    [] as [string, string][],
  )
  return new Headers(entries)
}

const normalizeRequest = (req: IncomingMessage & { body: any }) => {
  const protocol = req.headers["x-forwarded-proto"] || "http"
  const host = req.headers["x-forwarded-host"] || req.headers.host || "unknown"

  return new Request(new URL(req.url!, `${protocol}://${host}`), {
    method: req.method,
    headers: normalizeHeaders(req.headers),
    body: req.body || null,
  })
}

const normalizeResponse = (
  res: ServerResponse,
  body: object | string | Buffer | null | undefined,
) => {
  const responseHeaders = normalizeHeaders(res.getHeaders())
  // 204 No Content, 304 Not Modified don't allow body https://nextjs.org/docs/messages/invalid-api-status-body
  if (res.statusCode === 204 || res.statusCode === 304) {
    body = null
  }
  // Response accepts only string or Buffer and next supports objects
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    body = JSON.stringify(body)
  }
  return new Response(body, {
    status: res.statusCode,
    statusText: res.statusMessage,
    headers: responseHeaders,
  })
}

export function createVercelPagesMiddleware(config: AppearConfig) {
  const resolvedConfig = resolveConfig(config)
  // add integration specific config
  resolvedConfig.reporting.batchSize = 0 // disable batching because in lambda we need to send it straight away
  const report = reporter(resolvedConfig)

  return (handler: Handler): Handler =>
    async (req, baseRes) => {
      // create a proxy to capture the response body
      // we need to do this because the syntax is res.json({some: content})
      let body: object | string | Buffer | null | undefined
      const res = new Proxy(baseRes, {
        get(target, prop, receiver) {
          if (prop === "json" || prop === "send") {
            return (content: any) => {
              body = content
              return Reflect.get(target, prop, receiver)(content)
            }
          }
          return Reflect.get(target, prop, receiver)
        },
      })

      const result = await handler(req, res)
      try {
        const request = normalizeRequest(req)
        const response = normalizeResponse(res, body)
        const operation = await process(request, response, resolvedConfig)

        // report, don't await so we don't slow down response time
        waitUntil(report.report(operation))
      } catch (e) {
        console.error("[Appear introspector] failed with error", e)
      }
      return result
    }
}
