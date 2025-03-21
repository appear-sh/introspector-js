import { NodeSDK } from "@opentelemetry/sdk-node"
import moduleModule from "module"
import { AppearConfig } from "../config.js"
import { AppearExporter } from "./AppearExporter.js"
import { AppearInstrumentation } from "./AppearInstrumentation.js"

export function registerAppear(
  config: AppearConfig,
) {
  if (config.enabled === false) return

  moduleModule.register(
    "@opentelemetry/instrumentation/hook.mjs",
    import.meta.url,
  )

  const sdk = new NodeSDK({
    serviceName: config.serviceName,
    traceExporter: new AppearExporter(config),
    instrumentations: [new AppearInstrumentation(config)],
  })

  sdk.start()

  // listen to shutdown signals and fire sdk.shutdown()
  process.on("SIGTERM", () => sdk.shutdown())

  return sdk
}
