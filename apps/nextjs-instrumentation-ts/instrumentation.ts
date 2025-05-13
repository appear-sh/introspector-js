import { registerAppear } from "@appear.sh/introspector/node"

export const register = () => {
  registerAppear({
    apiKey: "test-key",
    environment: "test",
    serviceName: "nextjs-instrumentation-ts-test",
    reporting: { endpoint: process.env.COLLECTOR_URL },
  })
}
