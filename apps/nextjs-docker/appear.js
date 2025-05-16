import { registerAppear } from "@appear.sh/introspector/node"

registerAppear({
  apiKey: "test-key",
  environment: "test",
  serviceName: "nextjs-docker-test",
  reporting: { endpoint: process.env.COLLECTOR_URL },
})
