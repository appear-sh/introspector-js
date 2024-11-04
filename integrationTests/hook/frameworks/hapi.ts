import type { FrameworkTest, FrameworkStartedInfo } from "../hook.test"

function init(): Promise<FrameworkStartedInfo> {
  return new Promise((resolve) => {
    import("@hapi/hapi").then(({ server }) => {
      const app = server({
        port: 0,
        host: "localhost",
        routes: {
          payload: {
            parse: true,
            allow: ["application/json"],
          },
        },
      })

      app.route({
        method: "GET",
        path: "/hapi-ping",
        handler: (request, h) => {
          return h.response("hapi-pong").code(200)
        },
      })

      app.route({
        method: "POST",
        path: "/hapi-echo-request",
        handler: (request, h) => {
          return h.response(request.payload).code(200)
        },
      })

      app.route({
        method: "POST",
        path: "/hapi-echo-response",
        handler: (request, h) => {
          console.log("paylaod:", request)
          return h.response(request.payload).code(200)
        },
      })

      app.start().then(() => {
        resolve({
          port:
            typeof app.info.port === "string"
              ? parseInt(app.info.port)
              : app.info.port,
          stop: async () => {
            await app.stop()
            return null
          },
        })
      })
    })
  })
}

export const hapiTest: FrameworkTest = {
  framework: "hapi",
  init,
}
