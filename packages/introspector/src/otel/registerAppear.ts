import moduleModule from "node:module"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { AppearConfig } from "../config.js"
import { AppearExporter } from "./AppearExporter.js"
import { AppearInstrumentation } from "./AppearInstrumentation.js"

export function registerAppear(config: AppearConfig) {
  if (config.enabled === false) return

  moduleModule.register(
    "@opentelemetry/instrumentation/hook.mjs",
    import.meta.url, // todo try to remove this to see if it works, may remove warning during cjs build
  )

  const sdk = new NodeSDK({
    serviceName: config.serviceName,
    spanProcessors: [new BatchSpanProcessor(new AppearExporter(config))],
    instrumentations: [new AppearInstrumentation(config)],
  })

  sdk.start()

  // listen to shutdown signals and fire sdk.shutdown()
  process.on("beforeExit", async (exitCode) => {
    await Promise.race([
      sdk.shutdown(),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ])
    process.exit(exitCode)
  })

  return sdk
}
