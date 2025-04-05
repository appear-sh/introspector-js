import { registerAppear } from "@appear.sh/introspector/node"

registerAppear({
  apiKey: "test-key",
  environment: "test",
  reporting: { endpoint: process.env.COLLECTOR_URL },
})
