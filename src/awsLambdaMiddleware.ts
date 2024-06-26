import type {
  APIGatewayEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
} from "aws-lambda"
import { AppearIntrospector } from "./init"
import { AppearConfig, resolveConfig } from "./config"
import { reporter } from "./report"
import { url } from "inspector"
// @ts-ignore
import cleanupEvent from "serverless-http/lib/provider/aws/clean-up-event"
// @ts-ignore
import createRequest from "serverless-http/lib/provider/aws/create-request"

export function createLambdaMiddleware(config: AppearConfig) {
  const resolvedConfig = resolveConfig(config)
  resolvedConfig.reporting.batchSize = 0 // disable batching because in lambda we need to send it straight away
  const report = reporter(resolvedConfig)

  return (handler: Handler): Handler =>
    async (...args) => {
      const result = await handler(...args)

      const event = cleanupEvent(args[0], {})
      const req = createRequest(event, args[1], {})
      const res = new Response(result.body, {
        status: result.statusCode,
        headers: new Headers(result.headers),
      })
      console.log({ event, req, res, args })
      // todo report here, don't await
      return result
    }
}
