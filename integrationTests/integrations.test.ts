import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { MockCollector } from "./helpers/MockCollector.js"
import { startFrameworkServer } from "./helpers/helpers.js"
import stringify from "fast-json-stable-stringify"

// Test server implementations for different frameworks
const frameworks = [
  "express",
  "fastify",
  // Add more frameworks here (Next.js, etc.)
]

// Create test suite for each framework
frameworks.forEach((framework) => {
  describe(`Framework: ${framework}`, () => {
    let collector: MockCollector
    let server: { port: number; stop: () => Promise<void> }

    beforeAll(async () => {
      // Start mock collector
      collector = new MockCollector()
      await collector.start()

      // Start framework server in a separate process
      server = await startFrameworkServer(framework, collector.getUrl())
    })

    afterAll(async () => {
      await Promise.all([collector.stop(), server.stop()])
    })

    it(
      "should capture traces for incoming request and outgoing calls",
      { timeout: 30000 },
      async () => {
        // Make test request
        const response = await fetch(`http://localhost:${server.port}/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: "data" }),
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toBe("Success")

        // Wait for and verify traces
        const trace = await collector.waitForTrace(30000)

        // Censor ports in URIs and sort operations for consistent snapshots
        const operations = trace.operations
          .map((op) => {
            op.request.uri = op.request.uri.replace(/:\d+/, ":PORT")
            return op
          })
          .toSorted((a, b) => stringify(a).localeCompare(stringify(b)))

        expect(operations).toMatchSnapshot()
        expect(operations).toHaveLength(3)
      },
    )
  })
})
