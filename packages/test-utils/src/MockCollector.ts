import { createServer } from "http"
import type { AddressInfo } from "net"

export class MockCollector {
  private server: any
  private port: number = 0
  private traces: { endpoint: string; operations?: any[] }[] = []

  async start() {
    return new Promise<void>((resolve) => {
      this.server = createServer((req, res) => {
        if (req.method === "POST") {
          let body = ""
          req.on("data", (chunk) => (body += chunk))
          req.on("end", () => {
            try {
              const trace = JSON.parse(body)
              trace.endpoint = req.url
              this.traces.push(trace)
              res.writeHead(200)
              res.end()
            } catch (error) {
              console.error("Error parsing trace:", error)
              res.writeHead(500)
              res.end()
            }
          })
        } else {
          res.writeHead(405)
          res.end()
        }
      })

      this.server.listen(0, () => {
        this.port = (this.server.address() as AddressInfo).port
        resolve()
      })
    })
  }

  async stop() {
    return new Promise<void>((resolve) => {
      this.server.close(() => resolve())
    })
  }

  getUrl() {
    return `http://localhost:${this.port}`
  }

  getTraces() {
    return this.traces
  }

  clearTraces() {
    this.traces = []
  }

  async waitForOperations(count: number, timeout = 5000) {
    const timer = setTimeout(() => {
      throw new Error(`Timeout waiting for ${count} operations`)
    }, timeout)

    try {
      while (true) {
        const operations = this.traces
          .map((trace) => trace.operations)
          .flat()
          .filter(Boolean)
        if (operations.length >= count) return operations
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } finally {
      clearTimeout(timer)
    }
  }
}
