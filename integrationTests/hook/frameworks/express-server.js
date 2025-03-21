import express from "express"
import * as http from "node:https"

const app = express()
app.use(express.json())

app.get("/express-ping", (req, res) => {
  return res.end("express-pong")
})

app.post("/express-echo-request", (req, res) => {
  return res.json(req.body)
})

app.post("/express-echo-response", (req, res) => {
  return res.json(req.body)
})

app.get("/express-upstream", async (req, res) => {
  const fetchResponse = await fetch("https://httpbin.org/anything", {
    method: "POST",
    body: JSON.stringify({ source: "fetch" }),
    headers: { "Content-Type": "application/json" },
  })

  const httpRequestPromise = new Promise((resolve, reject) => {
    const httpRequest = http.request(
      "https://httpbin.org/anything",
      { method: "POST", headers: { "Content-Type": "application/json" } },
      (httpResponse) => {
        let data = ""
        httpResponse.on("data", (chunk) => {
          data += chunk
        })
        httpResponse.on("end", () => resolve(JSON.parse(data)))
      },
    )
    httpRequest.on("error", (error) => reject(error))
    httpRequest.write(JSON.stringify({ source: "http.request" }))
    httpRequest.end()
  })

  return res.json([await fetchResponse.json(), await httpRequestPromise])
})

const listener = app.listen(8069, () => {
  // @ts-ignore
  const port = listener.address().port
  console.log("listening on port", port)
})
