import { MeterProvider, TracerProvider } from "@opentelemetry/api"
import { LoggerProvider } from "@opentelemetry/api-logs"
import { Instrumentation } from "@opentelemetry/instrumentation"
import packageJson from "../../package.json" with { type: "json" }
import { AppearConfig, resolveConfig, ResolvedAppearConfig } from "../config.js"
import { HttpInstrumentation } from "./HttpInstrumentation.js"
import { UndiciInstrumentation } from "./UndiciInstrumentation.js"

export class AppearInstrumentation implements Instrumentation<AppearConfig> {
  public instrumentationName = packageJson.name
  public instrumentationVersion = packageJson.version
  protected config: ResolvedAppearConfig
  protected childInstrumentations: Instrumentation[]

  constructor(config: AppearConfig) {
    this.config = resolveConfig(config)
    this.childInstrumentations = [
      new HttpInstrumentation(this.config),
      new UndiciInstrumentation(this.config),
    ]
  }

  /** Method to disable the instrumentation  */
  disable() {
    this.childInstrumentations.forEach((inst) => inst.disable())
  }
  /** Method to enable the instrumentation  */
  enable() {
    this.childInstrumentations.forEach((inst) => inst.enable())
  }
  /** Method to set tracer provider  */
  setTracerProvider(tracerProvider: TracerProvider) {
    this.childInstrumentations.forEach((inst) =>
      inst.setTracerProvider(tracerProvider),
    )
  }
  /** Method to set meter provider  */
  setMeterProvider(meterProvider: MeterProvider) {
    this.childInstrumentations.forEach((inst) =>
      inst.setMeterProvider(meterProvider),
    )
  }
  /** Method to set logger provider  */
  setLoggerProvider(loggerProvider: LoggerProvider) {
    this.childInstrumentations.forEach((inst) =>
      inst.setLoggerProvider?.(loggerProvider),
    )
  }
  /** Method to set instrumentation config  */
  setConfig(config: AppearConfig) {
    this.config = resolveConfig(config)
  }
  /** Method to get instrumentation config  */
  getConfig() {
    return this.config
  }
}
