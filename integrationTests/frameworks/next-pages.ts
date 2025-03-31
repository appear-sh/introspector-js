import { spawn } from "child_process"
import { makeOutgoingCalls } from "../helpers/outgoingCalls.js"

const nextPagesServer = async () => {
  return new Promise<{ port: number; stop: () => Promise<void> }>(
    (resolve, reject) => {
      const cwd = process.cwd()
      process.chdir("./integrationTests/frameworks/next-pages")

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
          console.log(`[next-pages] ${output}`)

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
          console.error(`[next-pages] ${data}`)
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
        console.error(`[next-pages] Build error: ${data}`)
      })
    },
  )
}

// Start the server
nextPagesServer()
  .then((server) => {
    console.log(`Server started on port ${server.port}`)
  })
  .catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
  })
