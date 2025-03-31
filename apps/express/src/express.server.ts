import express from "express"
import type { AddressInfo } from "node:net"
import { makeOutgoingCalls } from "@appear.sh/test-utils"

const app = express()
app.use(express.json())

app.post("/api/test", async (req, res) => {
  await makeOutgoingCalls()
  res.json({ message: "Success", body: req.body })
})

const server = app.listen(0, () => {
  const port = (server.address() as AddressInfo).port
  console.log(`Server started on port ${port}`)
})
