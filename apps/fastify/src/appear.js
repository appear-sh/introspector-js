import { registerAppear } from "@appear.sh/introspector/node"

registerAppear({
  apiKey: "test-key",
  environment: "test",
  serviceName: "fastify-test",
  reporting: { endpoint: process.env.COLLECTOR_URL },
})
