import { ExportResult, ExportResultCode } from "@opentelemetry/core"
import { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"
import xxhash from "xxhashjs"
import { AppearConfig, resolveConfig, ResolvedAppearConfig } from "../config.js"
import { DEFAULT_REPORTING_ENDPOINT, Operation, Report } from "../report.js"

// Get version from package.json
// @ts-ignore - This is a dynamic require that TypeScript doesn't understand
const packageJson = require("../../package.json")

/**
 * This is implementation of {@link SpanExporter} that sends Appear specific spans to Appear.
 *
 */
export class AppearExporter implements SpanExporter {
  protected reportedOperationHashes = new Set()
  protected pendingExports: Set<Promise<void>> = new Set()
  protected readonly config: ResolvedAppearConfig

  constructor(partialConfig: AppearConfig) {
    this.config = resolveConfig(partialConfig)
  }

  /**
   * Export spans.
   * @param spans
   * @param resultCallback
   */
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    const operations = spans
      .map((span) => span.attributes["appear.operation"])
      .filter(Boolean)
      .filter((op) => {
        const hash = xxhash.h32(op as string, 1).toString(16)
        if (this.reportedOperationHashes.has(hash)) return false
        this.reportedOperationHashes.add(hash)
        return true
      })
      .map((op) => JSON.parse(op as string))

    if (operations.length === 0)
      return resultCallback({ code: ExportResultCode.SUCCESS })

    const pendingExport = this.sendOperations(operations)
      .then(() => resultCallback({ code: ExportResultCode.SUCCESS }))
      .catch((error) =>
        resultCallback({ code: ExportResultCode.FAILED, error }),
      )

    this.pendingExports.add(pendingExport)
    pendingExport.finally(() => this.pendingExports.delete)
  }

  /**
   * Shutdown the exporter.
   */
  async shutdown(): Promise<void> {
    return this.forceFlush()
  }

  /**
   * Exports any pending spans in exporter
   */
  async forceFlush(): Promise<void> {
    await Promise.all(Array.from(this.pendingExports))
  }

  /**
   * Showing spans in console
   * @param spans
   * @param done
   */
  private async sendOperations(operations: Operation[]) {
    const report: Report = {
      reporter: {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
      },
      operations,
    }
    const endpoint =
      this.config.reporting?.endpoint ?? DEFAULT_REPORTING_ENDPOINT
    try {
      // todo double check if vercel doesn't shutdown the function before it finishes
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.config.apiKey,
          "X-Appear-Runtime": "nodejs",
          "X-Appear-Introspector-Version": packageJson.version,
        },
        body: JSON.stringify(report),
      })

      if (!response.ok) {
        console.error(
          `[Appear introspector] failed to report with status ${
            response.status
          }\n${await response.text()}`,
        )
      }
    } catch (error) {
      console.error(
        `[Appear introspector] failed to report with error ${error}`,
      )
    }
  }
}
