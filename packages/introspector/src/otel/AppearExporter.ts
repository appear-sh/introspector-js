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

  constructor(config: AppearConfig) {
    this.reporter = new Reporter(config)
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
      .map((op) => JSON.parse(op as string) as Operation)

    const pendingExport = this.reporter
      .report(operations)
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
}
