import { registerAppear } from "@appear.sh/introspector"

registerAppear({
  apiKey: "test-key",
  environment: "test",
  reporting: { endpoint: process.env.COLLECTOR_URL },
})
