import { createServer } from "http"
import type { AddressInfo } from "net"
import { EventEmitter } from "events"

export class MockCollector {
  private server: any
  private port: number = 0
  private traces: any[] = []
  private emitter = new EventEmitter()

  async start() {
    return new Promise<void>((resolve) => {
      this.server = createServer((req, res) => {
        if (req.method === "POST") {
          let body = ""
          req.on("data", (chunk) => (body += chunk))
          req.on("end", () => {
            try {
              const trace = JSON.parse(body)
              this.traces.push(trace)
              this.emitter.emit("trace", trace)
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

  waitForTrace(timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timeout waiting for trace"))
      }, timeout)

      this.emitter.once("trace", (trace) => {
        clearTimeout(timer)
        resolve(trace)
      })
    })
  }
}
