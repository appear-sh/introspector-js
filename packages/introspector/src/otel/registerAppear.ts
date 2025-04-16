import moduleModule from "node:module"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { AppearConfig, AppearConfigSchema, resolveConfig } from "../config.js"
import { AppearExporter } from "./AppearExporter.js"
import { AppearInstrumentation } from "./AppearInstrumentation.js"
import { pathToFileURL } from "node:url"

const registerInstrumentationHook = () => {
  try {
    // Cross-platform way to get the current module's URL
    const moduleUrl =
      // @ts-ignore
      typeof import.meta !== "undefined" && import.meta.url
        ? // @ts-ignore
          import.meta.url
        : pathToFileURL(__filename)

    moduleModule.register("@opentelemetry/instrumentation/hook.mjs", moduleUrl)
  } catch (error) {
    // this is expected to fail in some environments
  }
}

export function registerAppear(config: AppearConfig) {
  if (config.enabled === false) return

  registerInstrumentationHook()

  try {
    // Validate config with Zod
    const validationResult = AppearConfigSchema.safeParse(config)
    if (!validationResult.success) {
      console.error(
        "Invalid Appear configuration:",
        validationResult.error.format(),
      )
      return undefined
    }

    const sdk = new NodeSDK({
      serviceName: config.serviceName,
      spanProcessors: [new BatchSpanProcessor(new AppearExporter(config))],
      instrumentations: [new AppearInstrumentation(config)],
    })

    sdk.start()

    if (config.debug) {
      console.debug("[Appear] Debug mode enabled")
      console.debug(
        "[Appear] Configuration:",
        JSON.stringify(resolveConfig(config), null, 2),
      )
    }

    // listen to shutdown signals and fire sdk.shutdown()
    process.on("beforeExit", async (exitCode) => {
      if (config.debug) console.debug("[Appear] Shutting down...")
      await Promise.race([
        sdk
          .shutdown()
          .then(() => console.debug("[Appear] Shutdown finished gracefully")),
        new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
          console.debug("[Appear] Shutdown timed out after 5000ms"),
        ),
      ])
      process.exit(exitCode)
    })

    return sdk
  } catch (error) {
    console.error("Failed to register Appear:", error)
  }
  return undefined
}
