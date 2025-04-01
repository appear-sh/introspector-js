import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import {
  formatTraceOperations,
  makeTestRequest,
  MockCollector,
} from "@appear.sh/test-utils"
import { spawn } from "node:child_process"

describe("Next.js App Router", () => {
  let collector: MockCollector
  let server: { port: number; stop: () => Promise<void> }

  beforeAll(
    () =>
      new Promise(async (resolve, reject) => {
        // Start mock collector
        collector = new MockCollector()
        await collector.start()

        const nextProcess = spawn("pnpm build && pnpm start", [], {
          env: { ...process.env, COLLECTOR_URL: collector.getUrl() },
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        })

        let port: number | undefined
        let error = ""

        nextProcess.stdout.on("data", (data) => {
          const output = data.toString()
          console.log(`[nextjs] ${output}`)

          // Look for the port number in the output
          const portMatch = output.match(/localhost:(\d+)/)
          if (portMatch) {
            port = parseInt(portMatch[1], 10)
            server = {
              port,
              stop: () =>
                new Promise<void>((resolve) => {
                  nextProcess.kill()
                  nextProcess.on("close", () => resolve())
                }),
            }
            resolve(undefined)
          }
        })

        nextProcess.stderr.on("data", (data) => {
          error += data.toString()
          console.error(`[nextjs] ${data}`)
        })

        nextProcess
          .on("error", (err) => {
            reject(
              new Error(
                `Failed to start nextjs server: ${err.message}\n${error}`,
              ),
            )
          })
          .on("close", (code) => {
            if (!port) {
              reject(
                new Error(
                  `Server closed before starting. Exit code: ${code}\n${error}`,
                ),
              )
            }
          })
      }),
  )

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
