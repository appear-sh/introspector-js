import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import {
  formatTraceOperations,
  makeTestRequest,
  MockCollector,
  startFrameworkServer,
} from "@appear.sh/test-utils"

describe("Next.js", () => {
  let collector: MockCollector
  let server: { port: number; stop: () => Promise<void> }

  beforeAll(async () => {
    // Start mock collector
    collector = new MockCollector()
    await collector.start()

    // Start framework server in a separate process
    server = await startFrameworkServer(collector.getUrl(), /localhost:(\d+)/)
  })

  afterAll(() => {
    collector?.stop()
    server?.stop()
  })

  beforeEach(() => {
    collector.clearTraces()
  })

  it(
    "should capture traces for incoming request and outgoing calls with app router",
    { timeout: 15000 },
    async () => {
      const { response, data } = await makeTestRequest(
        server.port,
        "/api/app-test",
      )
      expect(response.status).toBe(200)
      expect(data.message).toBe("Success")

      // Wait for and verify traces
      const operations = await collector.waitForOperations(2, 15000)
      const formattedOperations = formatTraceOperations(operations)

      expect(formattedOperations).toMatchSnapshot()
      // todo this should be 3
      // but introspector currently doesn't support incoming calls for next.js
      // because the instrumentaiton hook is incompatible with otel instrumentation-http
      expect(formattedOperations).toHaveLength(2)
    },
  )

  it(
    "should capture traces for incoming request and outgoing calls with pages router",
    { timeout: 15000 },
    async () => {
      const { response, data } = await makeTestRequest(
        server.port,
        "/api/pages-test",
      )
      expect(response.status).toBe(200)
      expect(data.message).toBe("Success")

      // Wait for and verify traces
      const operations = await collector.waitForOperations(1, 15000)
      const formattedOperations = formatTraceOperations(operations)

      expect(formattedOperations).toMatchSnapshot()
      // todo this should be 3
      // but introspector currently doesn't support incoming calls for next.js
      // because the instrumentaiton hook with pages router currently doesn't support outgoing calls
      expect(formattedOperations).toHaveLength(1)
    },
  )
})
