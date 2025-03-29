import { spawn } from "child_process"

export async function startFrameworkServer(
  framework: string,
  collectorUrl: string,
): Promise<{ port: number; stop: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = spawn(
      "node",
      [
        "--import",
        "./integrationTests/helpers/hook.ts",
        "--loader",
        "ts-node/esm",
        `integrationTests/frameworks/${framework.toLowerCase()}.ts`,
      ],
      {
        env: {
          ...process.env,
          COLLECTOR_URL: collectorUrl,
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    )

    let port: number | undefined
    let error = ""

    server.stdout.on("data", (data) => {
      const output = data.toString()
      console.log(`[${framework}] ${output}`)

      // Look for the port number in the output
      const portMatch = output.match(/Server started on port (\d+)/)
      if (portMatch) {
        port = parseInt(portMatch[1], 10)
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
      console.error(`[${framework}] ${data}`)
    })

    server.on("error", (err) => {
      reject(
        new Error(
          `Failed to start ${framework} server: ${err.message}\n${error}`,
        ),
      )
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
