import { spawn } from "child_process"

export async function startFrameworkServer(
  collectorUrl: string,
  portMatch: RegExp = /Server started on port (\d+)/,
): Promise<{ port: number; stop: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = spawn("pnpm", ["start"], {
      env: { ...process.env, COLLECTOR_URL: collectorUrl },
      stdio: ["pipe", "pipe", "pipe"],
    })

    let port: number | undefined
    let error = ""

    server.stdout.on("data", (data) => {
      const output = data.toString()
      console.log(`[test server] ${output}`)

      // Look for the port number in the output
      const portStr = output.match(portMatch)
      if (portStr) {
        port = parseInt(portStr[1], 10)
        resolve({
          port,
          stop: () =>
            new Promise<void>((resolve) => {
              server.kill()
              server.on("close", () => resolve())
            }),
        })
      }
    })

    server.stderr.on("data", (data) => {
      error += data.toString()
      console.error(`[test server] ${data}`)
    })

    server.on("error", (err) => {
      reject(new Error(`Failed to start server: ${err.message}\n${error}`))
    })

    server.on("close", (code) => {
      if (!port) {
        reject(
          new Error(
            `Server closed before starting. Exit code: ${code}\n${error}`,
          ),
        )
      }
    })
  })
}
