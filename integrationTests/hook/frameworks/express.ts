import type { FrameworkTest, FrameworkStartedInfo } from "../hook.test"

function init(): Promise<FrameworkStartedInfo> {
  return new Promise((resolve) => {
    import("express").then(({ default: express }) => {
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
        const upstreamRes = await fetch("https://httpbin.org/anything", {
          method: "POST",
          body: JSON.stringify({ message: "hello" }),
          headers: { "Content-Type": "application/json" },
        })
        return res.json(await upstreamRes.json())
      })

      const listener = app.listen(0, () => {
        // @ts-ignore
        const port = listener.address()!.port

        return resolve({
          port: parseInt(port),
          stop: async () => {
            return listener.close()
          },
        })
      })
    })
  })
}

export const expressTest: FrameworkTest = {
  framework: "express",
  init,
}
