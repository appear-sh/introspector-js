import { defaultInterceptFilter } from "./helpers.js"
import { DEFAULT_REPORTING_ENDPOINT } from "./report.js"

export interface AppearConfig {
  /** API key used for reporting */
  apiKey: string
  /** environment where the report is sent from */
  environment: string

  serviceName?: string

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
    /**
     * Optional function that allows to filter what request/response pair is getting analyzed and reported
     *
     * @default (req, req, config) => req.destination === "" && request.url !== config.reporting.endpoint
     */
    filter?: (
      request: Request,
      response: Response,
      config: ResolvedAppearConfig,
    ) => boolean
  }
}

export type ResolvedAppearConfig = Omit<
  Required<AppearConfig>,
  "reporting" | "interception" | "serviceName"
> & {
  serviceName?: string
  reporting: NonNullable<Required<AppearConfig["reporting"]>>
  interception: NonNullable<Required<AppearConfig["interception"]>>
}

export function resolveConfig(input: AppearConfig): ResolvedAppearConfig {
  return {
    enabled: true,
    ...input,
    interception: {
      disableXHR: false,
      filter: defaultInterceptFilter,
      ...input["interception"],
    },
    reporting: {
      batchIntervalSeconds: 5,
      batchSize: 10,
      endpoint: DEFAULT_REPORTING_ENDPOINT,
      ...input["reporting"],
    },
  }
}
