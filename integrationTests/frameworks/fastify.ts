import { makeOutgoingCalls } from "../helpers/outgoingCalls.js"
import fastify from "fastify"

export const fastifyServer = async () => {
  const app = fastify()

  // Register the test endpoint
  app.post("/api/test", async (request, reply) => {
    const responseBodies = await makeOutgoingCalls()
    return { message: "Success", responseBodies }
  })

  // Start the Fastify server
  const address: string = await app.listen()
  const port = parseInt(address.split(":").pop() ?? "0", 10)

  return {
    port,
    stop: async () => {
      await app.close()
    },
  }
}

// Start the server
fastifyServer()
  .then((server) => {
    console.log(`Server started on port ${server.port}`)
  })
  .catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
  })
