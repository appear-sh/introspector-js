import bodyParser from "body-parser"
import express from "express"
import { Server } from "http"

export const startExpress = async (): Promise<Server> => {
  const app = express()
  app.use(bodyParser.json())

  app.post("/echo", (req, res) => {
    res.json(req.body)
  })

  app.post("/helloworld", (_, res) => {
    res.json({ status: "OK" })
  })

  app.get("/invalid-json", (_, res) => {
    // Set our content type to application/json, but send a non-json body.
    res.set("Content-Type", "application/json")
    return res.end("not json")
  })

  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server))
  })
}
