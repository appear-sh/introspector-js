import { describe, it, expect, beforeAll, afterAll } from "vitest"
import {
  MockCollector,
  startFrameworkServer,
  formatTraceOperations,
  makeTestRequest,
} from "@appear.sh/test-utils"

describe("Fastify Framework", () => {
  let collector: MockCollector
  let server: { port: number; stop: () => Promise<void> }

  beforeAll(async () => {
    // Start mock collector
    collector = new MockCollector()
    await collector.start()

    // Start framework server in a separate process
    server = await startFrameworkServer(
      "src/fastify.server.ts",
      collector.getUrl(),
    )
  })

  afterAll(async () => {
    await Promise.all([collector.stop(), server.stop()])
  })

  it(
    "should capture traces for incoming request and outgoing calls",
    { timeout: 30000 },
    async () => {
      const { response, data } = await makeTestRequest(server.port)
      expect(response.status).toBe(200)
      expect(data.message).toBe("Success")

      // Wait for and verify traces
      const trace = await collector.waitForTrace(30000)
      const operations = formatTraceOperations(trace.operations)

      expect(operations).toMatchSnapshot()
      expect(operations).toHaveLength(3)
    },
  )
})
