import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import {
  formatTraceOperations,
  makeTestRequest,
  MockCollector,
} from "@appear.sh/test-utils"
import { spawn } from "node:child_process"

describe("NestJS App", () => {
  let collector: MockCollector
  let server: { port: number; stop: () => Promise<void> }

  beforeAll(
    () =>
      new Promise(async (resolve, reject) => {
        // Start mock collector
        collector = new MockCollector()
        await collector.start()

        const nestProcess = spawn("pnpm build && pnpm start", [], {
          env: { ...process.env, COLLECTOR_URL: collector.getUrl() },
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        })

        let port: number | undefined
        let error = ""

        nestProcess.stdout.on("data", (data) => {
          const output = data.toString()
          console.log(`[nestjs] ${output}`)

          // Look for the port number in the output
          const portMatch = output.match(/Server started on port (\d+)/)
          if (portMatch) {
            port = parseInt(portMatch[1], 10)
            server = {
              port,
              stop: () =>
                new Promise<void>((resolve) => {
                  nestProcess.kill()
                  nestProcess.on("close", () => resolve())
                }),
            }
            resolve(undefined)
          }
        })

        nestProcess.stderr.on("data", (data) => {
          error += data.toString()
          console.error(`[nestjs] ${data}`)
        })

        nestProcess
          .on("error", (err) => {
            reject(
              new Error(
                `Failed to start nestjs server: ${err.message}\n${error}`,
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
    "should capture traces for incoming request and outgoing calls",
    { timeout: 15000 },
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
