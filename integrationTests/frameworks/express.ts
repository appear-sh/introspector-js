import type { AddressInfo } from "net"

import { makeOutgoingCalls } from "../helpers/outgoingCalls.js"

const expressServer = async () => {
  const express = (await import("express")).default
  const app = express()
  app.use(express.json())

  app.post("/api/test", async (req, res) => {
    await makeOutgoingCalls()
    res.json({ message: "Success", body: req.body })
  })

  return new Promise<{ port: number; stop: () => Promise<void> }>((resolve) => {
    const server = app.listen(0, () => {
      const port = (server.address() as AddressInfo).port
      resolve({
        port,
        stop: () =>
          new Promise<void>((resolve) => server.close(() => resolve())),
      })
    })
  })
}

// Start the server
expressServer()
  .then((server) => {
    console.log(`Server started on port ${server.port}`)
  })
  .catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
  })
