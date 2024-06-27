import type { Handler } from "aws-lambda"
import { AppearConfig, resolveConfig } from "../config"
import { reporter } from "../report"
import { process } from "../process"
import { waitUntil } from "@vercel/functions"

export function createVercelMiddleware(config: AppearConfig) {
  const resolvedConfig = resolveConfig(config)
  // add integration specific config
  resolvedConfig.reporting.batchSize = 0 // disable batching because in lambda we need to send it straight away
  const report = reporter(resolvedConfig)

  return (handler: Handler): Handler =>
    async (...args) => {
      const result = await handler(...args)
      try {
        const [event] = args
        // convert redwoodjs/lambda event to standard Request/Response
        const protocol = event.headers["x-forwarded-proto"] || "http"
        const host =
          event.headers["x-forwarded-host"] || event.headers.host || "unknown"
        const req = new Request(new URL(event.path, `${protocol}://${host}`), {
          method: event.httpMethod,
          headers: new Headers(event.headers),
          body: event.body, // todo what if isBase64Encoded?
        })
        const res = new Response(result.body, {
          status: result.statusCode,
          headers: new Headers(result.headers),
        })

        console.log({ event, req, res })
        const operation = await process(req, res, resolvedConfig)

        console.log("Operation", JSON.stringify(operation, null, 2))

        // report, don't await so we don't slow down response time
        waitUntil(report.report(operation))
      } catch (e) {
        console.error("[Appear introspector] failed with error", e)
      }
      return result
    }
}
