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

  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server))
  })
}
