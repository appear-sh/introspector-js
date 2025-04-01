import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import {
  MockCollector,
  startFrameworkServer,
  formatTraceOperations,
  makeTestRequest,
} from "@appear.sh/test-utils"

describe("Express Framework", () => {
  let collector: MockCollector
  let server: { port: number; stop: () => Promise<void> }

  beforeAll(async () => {
    // Start mock collector
    collector = new MockCollector()
    await collector.start()

    // Start framework server in a separate process
    server = await startFrameworkServer(
      "src/express.server.ts",
      collector.getUrl(),
    )
  })

  afterAll(() => {
    collector?.stop()
    server?.stop()
  })

  beforeEach(() => {
    collector.clearTraces()
  })

  it(
    "should capture traces for incoming request and outgoing calls",
    { timeout: 30000 },
    async () => {
      const { response, data } = await makeTestRequest(server.port)
      expect(response.status).toBe(200)
      expect(data.message).toBe("Success")
      const operations = await collector.waitForOperations(3, 30000)
      const formattedOperations = formatTraceOperations(operations)
      expect(formattedOperations).toMatchSnapshot()
      expect(formattedOperations).toHaveLength(3)
    },
  )
})
