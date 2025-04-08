import { defaultInterceptFilter } from "./helpers.js"
import { DEFAULT_REPORTING_ENDPOINT } from "./report.js"

export interface AppearConfig {
  /**
   * API key used for reporting
   * you can obtain your reporting key in keys section in Appear settings
   * reporting keys have only the permission to report schema and can't read any data
   * you can use any method to inject the key, in examples we used env variable
   */
  apiKey: string
  /**
   * Environment where the report is sent from
   * it can be any string that identifies environment data are reported from.
   * Often used as "production" or "staging", however if you're using some form of ephemeral farm feel free to use it's identifier
   */
  environment: string

  /**
   * Name of current service
   * used to improve accuracy of matching, useful when you're not using descriptive host names in incoming requests
   * for example if you're using directly IP addresses
   *
   * @optional
   * @default hostname if not provided the service name will be detected from hostname
   */
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
  }

  interception?: {
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
      filter: defaultInterceptFilter,
      ...input["interception"],
    },
    reporting: {
      endpoint: DEFAULT_REPORTING_ENDPOINT,
      ...input["reporting"],
    },
  }
}
