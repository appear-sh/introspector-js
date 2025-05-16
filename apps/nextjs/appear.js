import { registerAppear } from "@appear.sh/introspector/node"
import { defaultInterceptFilter } from "@appear.sh/introspector"

registerAppear({
  apiKey: "test-key",
  environment: "test",
  serviceName: "nextjs-test",
  reporting: { endpoint: process.env.COLLECTOR_URL },
  interception: {
    filter: (request, response, config) => {
      return (
        !request.url.includes("/_next/") &&
        defaultInterceptFilter(request, response, config)
      )
    },
  },
})
