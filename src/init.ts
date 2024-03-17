// load config, init interceptor

import { intercept } from "./intercept"
import { reporter } from "./report"

export interface AppearIntrospector {
  stop: () => void
}

export interface AppearConfig {
  apiKey: string
  environment: string
  enabled?: boolean

  reporting?: {
    endpoint?: string
    batchIntervalSeconds?: number
    batchSize?: number
  }

  interception?: {
    disableXHR?: boolean
  }
}

export async function init(config: AppearConfig): Promise<AppearIntrospector> {
  // Short-circuit everything, do nothing.
  if (config.enabled === false) return { stop: () => {} }

  const report = reporter(config)
  report.start()

  const interceptor = await intercept(config, (op) => report.report(op))

  return {
    stop: () => {
      interceptor.stop()
      report.stop()
    },
  }
}
