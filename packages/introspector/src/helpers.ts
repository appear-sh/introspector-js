import { ResolvedAppearConfig } from "./config.js"

export const isNonNullable = <T extends any>(
  value: T,
): value is NonNullable<T> => {
  return typeof value !== "undefined" && value !== null
}

export const defaultInterceptFilter = (
  request: Request,
  response: Response,
  config: ResolvedAppearConfig,
): boolean => {
  // Fetch & XHR don't have set destination
  // Probably something we don't care about, ignore.
  if (request.destination !== "") return false
  // ignore reports to Appear
  if (request.url === config.reporting.endpoint) return false

  return true
}
