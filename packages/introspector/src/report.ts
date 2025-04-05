import { AppearConfig, resolveConfig } from "./config.js"
import {
  SomeSchemaType,
  StringSchemaType,
} from "./contentTypes/jsonSchema.types.js"
import xxhash from "xxhashjs"
import stringify from "fast-json-stable-stringify"
// Get version from package.json
// @ts-ignore - This is a dynamic require that TypeScript doesn't understand
const packageJson = require("../package.json")

export const DEFAULT_REPORTING_ENDPOINT = "https://api.appear.sh/v1/reports"

export type Operation = {
  direction: "incoming" | "outgoing"
  request: {
    origin?: string
    method: string
    uri: string
    headers: Record<string, StringSchemaType>
    query: Record<string, SomeSchemaType>
    body: null | {
      type?: "string"
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentschema
      contentSchema?: SomeSchemaType
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentmediatype
      contentMediaType: string
    }
  }
  response: {
    statusCode: number
    headers: Record<string, StringSchemaType>
    body: null | {
      type?: "string"
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentschema
      contentSchema?: SomeSchemaType
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentmediatype
      contentMediaType: string
    }
  }
}

export type Report = {
  reporter: {
    // meta info about the reporter
    environment: string
    serviceName?: string
  }
  operations: Operation[]
}

const reportedOperationHashes = new Set()
export async function report({
  operations,
  config,
}: {
  operations: Operation[]
  config: AppearConfig
}) {
  const resolvedConfig = resolveConfig(config)
  const buffer = operations.filter((op) => {
    const hash = xxhash.h32(stringify(op), 1).toString(16)
    if (reportedOperationHashes.has(hash)) return false
    reportedOperationHashes.add(hash)
    return true
  })

  if (buffer.length === 0) return true

  const report: Report = {
    reporter: {
      serviceName: resolvedConfig.serviceName,
      environment: resolvedConfig.environment,
    },
    operations: buffer,
  }

  try {
    const response = await fetch(resolvedConfig.reporting.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": resolvedConfig.apiKey,
        "X-Appear-Runtime": "nodejs",
        "X-Appear-Introspector-Version": packageJson.version,
      },
      body: JSON.stringify(report),
    })

    if (response.ok) return true

    console.error(
      `[Appear introspector] failed to report with status ${
        response.status
      }\n${await response.text()}`,
    )
  } catch (error) {
    console.error(`[Appear introspector] failed to report with error ${error}`)
  }
  return false
}
