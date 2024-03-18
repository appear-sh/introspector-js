// load config, init interceptor

import { intercept } from "./intercept"
import { reporter } from "./report"

export interface AppearIntrospector {
  stop: () => void
}

export interface AppearConfig {
  /** API key used for reporting */
  apiKey: string
  /** environment where the report is sent from */
  environment: string
  /** 
   * flag you can use to disable introspector completely
   * useful if you don't want to report in certain environments
   * 
   * @default true
   */
  enabled?: boolean

  /** configuration of how often and where are data reported */
  reporting?: {
    /** 
     * endpoint reports are sent to, useful if you want to audit what data are reported
     * simple audit can be done by navigating to https://public.requestbin.com/r which will give you endpoint url you can paste here and see in the debugger all traffic
     * 
     * @default https://api.appear.sh/v1/reports
     */
    endpoint?: string
    /** 
     * interval how often are batches sent 
     * `0` means that reports are sent immidiately
     * 
     * @default 5
     */
    batchIntervalSeconds?: number
    /** number of items in batch before it reports them
     * report can be triggered be either time or size depending on what happens first
     * 
     * every schema is reported only once
     * 
     * `0` means batching is disabled and reports are sent immidiately
     * 
     * @default 10
     */
    batchSize?: number
  }

  interception?: {
    /** 
     * disables XHR introspection hook which may introduce noise in some situations
     * 
     * @default false
     */
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
