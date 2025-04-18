import express from "express"
import type { AddressInfo } from "node:net"
import { makeOutgoingCalls } from "@appear.sh/test-utils"

const app = express()
app.use(express.json())

app.post("/api/test", async (req, res) => {
  await makeOutgoingCalls("express")
  res.json({ message: "Success", body: req.body })
})

app.post("/api/empty", async (req, res) => {
  await makeOutgoingCalls("express", "https://httpbin.org/status/304")
  res.json({ message: "Success" })
})

const server = app.listen(0, () => {
  const port = (server.address() as AddressInfo).port
  console.log(`Server started on port ${port}`)
})
