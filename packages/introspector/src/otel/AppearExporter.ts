import { ExportResult, ExportResultCode } from "@opentelemetry/core"
import { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"
import { AppearConfig } from "../config.js"
import { Operation, Reporter } from "../report.js"

/**
 * This is implementation of {@link SpanExporter} that sends Appear specific spans to Appear.
 *
 */
export class AppearExporter implements SpanExporter {
  protected pendingExports: Set<Promise<void>> = new Set()
  protected readonly reporter: Reporter
  protected readonly debug: boolean

  constructor(config: AppearConfig) {
    this.reporter = new Reporter(config)
    this.debug = config.debug || false
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
    console.log(`[Appear] Filtering ${spans.length} spans`)
    const operations = spans
      .map((span) => span.attributes["appear.operation"])
      .filter(Boolean)
      .map((op) => JSON.parse(op as string) as Operation)

    if (operations.length === 0) return

    if (this.debug) {
      console.debug(`[Appear] Exporting ${operations.length} operations:`)
      operations.forEach((op) =>
        console.debug(`[Appear] Exporting operation: ${JSON.stringify(op)}`),
      )
    }

    const pendingExport = this.reporter
      .report(operations)
      .then(() => {
        if (this.debug)
          console.debug(
            `[Appear] Successfully exported ${operations.length} operations`,
          )
        resultCallback({ code: ExportResultCode.SUCCESS })
      })
      .catch((error) => {
        if (this.debug)
          console.error(
            `[Appear] Failed to export ${operations.length} operations:`,
            error,
          )
        resultCallback({ code: ExportResultCode.FAILED, error })
      })

    this.pendingExports.add(pendingExport)
    pendingExport.finally(() => this.pendingExports.delete(pendingExport))
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
}
