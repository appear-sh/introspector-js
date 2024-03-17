import {
  SomeSchemaType,
  StringSchemaType,
} from "./contentTypes/jsonSchema.types"
import packageJson from "../package.json"
import stableStringify from "fast-json-stable-stringify"
import xxhash from "xxhashjs"
import type { AppearConfig } from "./init"

export const DEFAULT_REPORTING_ENDPOINT = "https://app.appear.sh/api/v1/reports"

export type Operation = {
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
  }
  operations: Operation[]
}

export const reporter = (config: AppearConfig) => {
  const sendImmediately =
    config.reporting?.batchIntervalSeconds === 0 ||
    config.reporting?.batchSize === 0

  const reportedOperationHashes: string[] = []
  let bufferedOperations: Operation[] = []
  let timer: NodeJS.Timeout | null = null

  const start = () => {
    if (!sendImmediately) {
      timer = setInterval(flush, config.reporting?.batchIntervalSeconds ?? 5000)
    }
  }
  const stop = async () => {
    await flush()
    if (timer) clearInterval(timer)
  }
  const report = async (op: Operation) => {
    const hash = xxhash.h32(stableStringify(op), 1).toString(16)
    // if it was already reported skip it
    if (reportedOperationHashes.includes(hash)) return

    // add to buffer and dedupe
    bufferedOperations.push(op)
    reportedOperationHashes.push(hash)

    if (
      sendImmediately ||
      bufferedOperations.length > (config.reporting?.batchSize ?? 10)
    ) {
      return flush()
    }
  }
  const flush = async () => {
    if (bufferedOperations.length === 0) return

    const report: Report = {
      reporter: { environment: config.environment },
      operations: [...bufferedOperations],
    }
    bufferedOperations = []

    // try send report, in case of error return operations back to batch

    const endpoint = config.reporting?.endpoint ?? DEFAULT_REPORTING_ENDPOINT

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
          "X-Appear-Runtime": "nodejs",
          "X-Appear-Introspector-Version": packageJson.version,
        },
        body: JSON.stringify(report),
      })

      if (!response.ok) {
        // return ops back to buffer in case of error
        bufferedOperations.push(...report.operations)
        console.error(
          `[Appear introspector] failed to report with status ${
            response.status
          }\n${await response.text()}`,
        )
      }
    } catch (error) {
      // return ops back to buffer in case of error
      bufferedOperations.push(...report.operations)
      console.error(
        `[Appear introspector] failed to report with error ${error}`,
      )
    }
  }

  return { start, stop, report, flush }
}
