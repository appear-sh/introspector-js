import type { FrameworkTest, FrameworkStartedInfo } from "../hook.test"

function init(): Promise<FrameworkStartedInfo> {
  return new Promise((resolve) => {
    Promise.all([
      import("koa"),
      import("@koa/router"),
      import("koa-bodyparser"),
    ]).then(
      ([{ default: Koa }, { default: Router }, { default: bodyParser }]) => {
        const app = new Koa()
        const router = new Router()

        app.use(bodyParser())

        router.get("/koa-ping", (ctx) => {
          ctx.body = "koa-pong"
        })

        router.post("/koa-echo-request", (ctx) => {
          ctx.body = ctx.request.body
        })

        router.post("/koa-echo-response", (ctx) => {
          ctx.body = ctx.request.body
        })

        app.use(router.routes())
        app.use(router.allowedMethods())

        const listener = app.listen(0, () => {
          // @ts-ignore
          const port = listener.address()!.port

          return resolve({
            port: parseInt(port),
            stop: async () => {
              return new Promise((resolve) => {
                listener.close(() => resolve(null))
              })
            },
          })
        })
      },
    )
  })
}

export const koaTest: FrameworkTest = {
  framework: "koa",
  init,
}
