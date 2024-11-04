import { beforeAll, describe, expect, it } from "vitest"
import EventEmitter from "events"

import * as Appear from "../../src"

import { expressTest } from "./frameworks/express"
import { koaTest } from "./frameworks/koa"
import { hapiTest } from "./frameworks/hapi"
import { nestTest } from "./frameworks/nest"

export interface FrameworkStartedInfo {
  port: number
  stop: () => Promise<any>
}

export interface FrameworkTest {
  framework: string
  init: () => Promise<FrameworkStartedInfo>
}

interface HookEvents {
  request: [
    {
      req: Request
      res: Response
    },
  ]
}

export const tests: FrameworkTest[] = [
  expressTest,
  koaTest,
  // hapi tests break for some reason
  // hapiTest,
  nestTest,
]

describe.sequential("hooks", () => {
  beforeAll(async () => {
    await import("../../src/hook/index")
  })

  for (const test of tests) {
    describe.sequential(test.framework, () => {
      let appear: Appear.AppearIntrospector
      let info: FrameworkStartedInfo
      let emitter = new EventEmitter<HookEvents>()

      function url(path: string) {
        return `http://localhost:${info.port}${path}`
      }

      function doTestsOnReq(
        tests: (req: Request, res: Response) => Promise<void>,
        requestTester: (req: Request) => boolean,
        caller: () => Promise<void>,
      ) {
        return new Promise((resolve, reject) => {
          emitter.on("request", async ({ req, res }) => {
            if (!requestTester(req)) {
              return
            }

            try {
              await tests(req, res)
              resolve(undefined)
            } catch (e) {
              reject(e)
            }
          })

          caller()
        })
      }

      beforeAll(async () => {
        appear = await Appear.init({
          apiKey: "key",
          environment: "test",
          interception: {
            filter: (req, res) => {
              emitter.emit("request", {
                req: req.clone(),
                res: res.clone(),
              })
              return false
            },
          },
        })

        info = await test.init()

        return () => {
          return Promise.all([appear.stop(), info.stop()])
        }
      })

      it(`${test.framework}: should capture raw responses`, async () => {
        return doTestsOnReq(
          async (req, res) => {
            expect(res.status).toBe(200)
            expect(await res.text()).toBe(`${test.framework}-pong`)
          },
          (req) => req.url.endsWith(`/${test.framework}-ping`),
          async () => {
            await fetch(url(`/${test.framework}-ping`))
          },
        )
      })

      it(`${test.framework}: should capture json requests`, async () => {
        return doTestsOnReq(
          async (req, res) => {
            expect(res.status).toBe(200)
            expect(req.method).toBe("POST")
            expect(req.headers.get("content-type")).toBe("application/json")
            expect(await req.json()).toEqual({
              message: `${test.framework}-json-request`,
            })
          },
          (req) => req.url.endsWith(`/${test.framework}-echo-request`),
          async () => {
            await fetch(url(`/${test.framework}-echo-request`), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: `${test.framework}-json-request`,
              }),
            })
          },
        )
      })

      it(`${test.framework}: should capture json responses`, async () => {
        return doTestsOnReq(
          async (req, res) => {
            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ message: "hello" })
          },
          (req) => req.url.endsWith(`/${test.framework}-echo-response`),
          async () => {
            await fetch(url(`/${test.framework}-echo-response`), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ message: "hello" }),
            })
          },
        )
      })
    })
  }
})
