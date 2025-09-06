import { registerAppear } from "@appear.sh/introspector/nextjs"

registerAppear({
  apiKey: "test-key",
  environment: "test",
  serviceName: "nextjs-test",
  reporting: { endpoint: process.env.COLLECTOR_URL },
})
