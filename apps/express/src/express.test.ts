import {
  didReceivePing,
  formatTraceOperations,
  makeTestRequest,
  MockCollector,
  startFrameworkServer,
} from "@appear.sh/test-utils"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

describe("Express Framework", () => {
  let collector: MockCollector
  let server: { port: number; stop: () => Promise<void> }

  beforeAll(async () => {
    // Start mock collector
    collector = new MockCollector()
    await collector.start()

    // Start framework server in a separate process
    server = await startFrameworkServer(collector.getUrl())
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
    "should capture traces for incoming request and outgoing calls",
    { timeout: 30000 },
    async () => {
      const { response, data } = await makeTestRequest(server.port)
      expect(response.status).toBe(200)
      const operations = await collector.waitForOperations(3, 30000)
      const formattedOperations = formatTraceOperations(operations)
      expect(formattedOperations).toMatchSnapshot()
      expect(formattedOperations).toHaveLength(3)
    },
  )

  it(
    "should handle empty responses gracefully",
    { timeout: 30000 },
    async () => {
      const { response } = await makeTestRequest(server.port, "/api/empty")
      expect(response.status).toBe(200)
      const operations = await collector.waitForOperations(3, 30000)
      const formattedOperations = formatTraceOperations(operations)
      expect(formattedOperations).toMatchSnapshot()
      expect(formattedOperations).toHaveLength(3)
    },
  )
})
