import { registerAppear } from "@appear.sh/introspector"

export function register() {
  const collectorUrl = process.env.COLLECTOR_URL
  if (!collectorUrl) {
    throw new Error("COLLECTOR_URL environment variable is required")
  }
  // Register OpenTelemetry with mock collector
  registerAppear({
    apiKey: "test-key",
    environment: "test",
    reporting: { endpoint: collectorUrl },
  })
}
