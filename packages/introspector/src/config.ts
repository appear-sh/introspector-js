import { defaultInterceptFilter } from "./helpers.js"
import { DEFAULT_REPORTING_ENDPOINT } from "./report.js"
import { z } from "zod"

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

  /**
   * Enable debug mode which will output detailed debug information to the console,
   * including all reported traffic, validation errors, and other diagnostic data.
   * Useful for troubleshooting and understanding what data is being sent to Appear.
   *
   * @default false
   */
  debug?: boolean

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

// Zod schema for AppearConfig validation
export const AppearConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  environment: z.string().min(1, "Environment is required"),
  serviceName: z.string().optional(),
  enabled: z.boolean().optional(),
  debug: z.boolean().optional(),
  reporting: z
    .object({
      endpoint: z.string().url().optional(),
    })
    .optional(),
  interception: z
    .object({
      filter: z.function().optional(),
    })
    .optional(),
})

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
    debug: false,
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
