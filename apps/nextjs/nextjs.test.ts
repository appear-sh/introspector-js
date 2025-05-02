import {
  didReceivePing,
  formatTraceOperations,
  makeTestRequest,
  MockCollector,
  startFrameworkServer,
} from "@appear.sh/test-utils"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

describe("Next.js", () => {
  let collector: MockCollector
  let server: { port: number; stop: () => Promise<void> }

  beforeAll(async () => {
    // Start mock collector
    collector = new MockCollector()
    await collector.start()

    // Start framework server in a separate process
    server = await startFrameworkServer(collector.getUrl(), /localhost:(\d+)/)
  }, 30000)

  afterAll(() => {
    collector?.stop()
    server?.stop()
  })

  afterEach(() => {
    collector.clearTraces()
  })

  it("should send ping", async () => {
    const traces = collector.getTraces()
    expect(didReceivePing(traces)).toBe(true)
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

      // Wait for and verify traces
      const operations = await collector.waitForOperations(2, 15000)
      const formattedOperations = formatTraceOperations(operations)

      expect(formattedOperations).toMatchSnapshot()
      // todo this should be 3
      // but introspector currently doesn't support incoming calls for next.js
      // because the instrumentaiton hook is incompatible with otel instrumentation-http
      expect(formattedOperations).toHaveLength(3)
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

      // Wait for and verify traces
      const operations = await collector.waitForOperations(1, 15000)
      const formattedOperations = formatTraceOperations(operations)

      expect(formattedOperations).toMatchSnapshot()
      // todo this should be 3
      // but introspector currently doesn't support incoming calls for next.js
      // because the instrumentaiton hook with pages router currently doesn't support outgoing calls
      expect(formattedOperations).toHaveLength(3)
    },
  )
})
