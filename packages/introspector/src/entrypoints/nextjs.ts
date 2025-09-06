import { ResolvedAppearConfig } from "../config.js"
import { defaultInterceptFilter as baseInterceptFilter } from "../helpers.js"
import { registerAppear as nodeRegisterAppear } from "./node.js"

export {
  AppearExporter,
  AppearInstrumentation,
  HttpInstrumentation,
  UndiciInstrumentation,
} from "./node.js"

export const defaultInterceptFilter = (
  request: Request,
  response: Response,
  config: ResolvedAppearConfig,
): boolean => {
  const [contentType, contentFormat] =
    response.headers.get("content-type")?.toLowerCase()?.split("/") ?? []

  return (
    baseInterceptFilter(request, response, config) &&
    !request.url.includes("/_next/") &&
    contentType === "application" &&
    !!contentFormat?.includes("json") // the contentFormat sometimes can include other attributes like "vnd.something-other+json" or json;charset=utf-8
  )
}

export const registerAppear: typeof nodeRegisterAppear = (config) => {
  return nodeRegisterAppear({
    ...config,
    interception: {
      filter: defaultInterceptFilter,
      ...config.interception,
    },
  })
}
