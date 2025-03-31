import { spawn } from "child_process"
import { makeOutgoingCalls } from "../helpers/outgoingCalls.js"

const nextAppServer = async () => {
  return new Promise<{ port: number; stop: () => Promise<void> }>(
    (resolve, reject) => {
      const cwd = process.cwd()
      process.chdir("./integrationTests/frameworks/next-app")

      // First build the Next.js app
      const build = spawn("pnpm", ["run", "build"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
        },
      })

      build.on("close", (code) => {
        if (code !== 0) {
          process.chdir(cwd)
          reject(new Error(`Next.js build failed with code ${code}`))
          return
        }

        // Then start the production server
        // next start --port 0

        // const server = spawn(
        //   "node",
        //   [
        //     "--import",
        //     "./integrationTests/helpers/hook.ts",

        //   ],
        //   {
        //     env: {
        //       ...process.env,
        //       COLLECTOR_URL: collectorUrl,
        //     },
        //     stdio: ["pipe", "pipe", "pipe"],
        //   },
        // )

        const server = spawn("pnpm", ["run", "start"], {
          stdio: ["pipe", "pipe", "pipe"],
          env: {
            ...process.env,
          },
        })

        let port: number | undefined
        let error = ""

        server.stdout.on("data", (data) => {
          const output = data.toString()
          console.log(`[next-app] ${output}`)

          // Look for the port number in the output
          const portMatch = output.match(/http:\/\/localhost:(\d+)/)
          if (portMatch) {
            port = parseInt(portMatch[1], 10)
            resolve({
              port,
              stop: () =>
                new Promise<void>((resolve) => {
                  server.kill()
                  server.on("close", () => {
                    process.chdir(cwd)
                    resolve()
                  })
                }),
            })
          }
        })

        server.stderr.on("data", (data) => {
          error += data.toString()
          console.error(`[next-app] ${data}`)
        })

        server.on("error", (err) => {
          process.chdir(cwd)
          reject(
            new Error(
              `Failed to start Next.js server: ${err.message}\n${error}`,
            ),
          )
        })

        server.on("close", (code) => {
          if (!port) {
            process.chdir(cwd)
            reject(
              new Error(
                `Server closed before starting. Exit code: ${code}\n${error}`,
              ),
            )
          }
        })
      })

      build.stderr.on("data", (data) => {
        console.error(`[next-app] Build error: ${data}`)
      })
    },
  )
}

// Start the server
nextAppServer()
  .then((server) => {
    console.log(`Server started on port ${server.port}`)
  })
  .catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
  })
