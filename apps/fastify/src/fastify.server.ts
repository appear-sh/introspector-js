import fastify from "fastify"
import { makeOutgoingCalls } from "@appear.sh/test-utils"

const app = fastify()

app.post("/api/test", async (request, reply) => {
  await makeOutgoingCalls()
  return { message: "Success", body: request.body }
})

app
  .listen()
  .then((address) => parseInt(address.split(":").pop() ?? "0", 10))
  .then((port) => console.log(`Server started on port ${port}`))
