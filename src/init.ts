// load config, init interceptor

import { AppearConfig, resolveConfig } from "./config"
import { defaultInterceptFilter, intercept } from "./intercept"
import { DEFAULT_REPORTING_ENDPOINT, reporter } from "./report"

export interface AppearIntrospector {
  stop: () => void
}

export async function init(config: AppearConfig): Promise<AppearIntrospector> {
  // Short-circuit everything, do nothing.
  if (config.enabled === false) return { stop: () => {} }

  const resolvedConfig = resolveConfig(config)
  const report = reporter(resolvedConfig)
  report.start()

  const interceptor = await intercept(resolvedConfig, (op) => report.report(op))

  return {
    stop: () => {
      interceptor.stop()
      report.stop()
    },
  }
}
