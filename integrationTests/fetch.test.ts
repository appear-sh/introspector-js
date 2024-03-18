import { describe, it, beforeAll, expect } from "vitest"
import * as Appear from "../src/index"
import { http, HttpResponse, passthrough } from "msw"
import { setupServer } from "msw/node"
import { DEFAULT_REPORTING_ENDPOINT } from "../src/report"
import { startExpress } from "./server"
import { AddressInfo } from "net"
import { Report } from "../src/report"

describe("integration: fetch", () => {
  const msw = setupServer()
  const appearSuccessHandler = http.post(DEFAULT_REPORTING_ENDPOINT, () =>
    HttpResponse.json({ success: true }),
  )
  const appearErrorHandler = http.post(DEFAULT_REPORTING_ENDPOINT, () =>
    HttpResponse.json({ success: false }, { status: 500 }),
  )
  const express = startExpress()
  let testUrl: string

  beforeAll(async () => {
    msw.listen()
    await Appear.init({
      apiKey: "testKey",
      environment: "test",
      reporting: { batchSize: 0 },
    })
    const { port } = (await express).address() as AddressInfo
    testUrl = `http://127.0.0.1:${port}/helloworld`
    msw.use(http.all(testUrl, () => passthrough()))
  })

  it("should report correct schema", async () => {
    msw.use(appearSuccessHandler)
    const reports: Request[] = []
    msw.events.on("request:start", ({ request, requestId }) => {
      if (request.url === DEFAULT_REPORTING_ENDPOINT) reports.push(request)
    })

    // test call to mock server which should be reported
    await fetch(`${testUrl}?some=query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-test": "this is a test",
      },
      body: JSON.stringify({
        type: "Login",
        username: "adam@boxxen.org",
        password: "mysecretpassword",
        somethingElseStringArray: ["hello"],
        multiArray: ["hello", 5, 5],
        emptyArrray: [],
        nested: {
          one: "two",
        },
        bo: true,
        no: undefined,
        null: null,
        complexArray: [
          { hello: 5, world: { nested: { yeah: [1, 2, 3] } } },
          { hello: 100 },
        ],
        wasFetch: true,
      }),
    })

    // wait a tiny bit for report to be sent
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(reports.length).toEqual(1)
    const report: Report = await reports[0]!.clone().json()
    const operation = report.operations[0]!

    // meta
    expect(reports[0]!.headers.get("x-api-key")).toEqual("testKey")
    expect(report.reporter.environment).toEqual("test")

    // base
    expect(operation.request.method).toEqual("POST")
    expect(operation.request.uri).toEqual(testUrl)
    expect(operation.request.headers["x-test"]?.type).toEqual("string")
    expect(operation.request.query["some"]?.type).toEqual("string")
    expect(operation.request.body?.type).toEqual("string")
    expect(operation.request.body?.contentMediaType).toEqual("application/json")

    expect(operation.response.body?.type).toEqual("string")
    expect(operation.response.body?.contentMediaType).toEqual(
      "application/json",
    )

    // request schema
    expect(operation.request.body?.contentSchema).toStrictEqual({
      properties: {
        bo: {
          type: "boolean",
        },
        complexArray: {
          items: {
            properties: {
              hello: {
                maximum: 100,
                minimum: 5,
                type: "integer",
              },
              world: {
                properties: {
                  nested: {
                    properties: {
                      yeah: {
                        items: {
                          maximum: 3,
                          minimum: 1,
                          type: "integer",
                        },
                        maxItems: 3,
                        minItems: 3,
                        type: "array",
                      },
                    },
                    required: ["yeah"],
                    type: "object",
                  },
                },
                required: ["nested"],
                type: "object",
              },
            },
            required: ["hello"],
            type: "object",
          },
          maxItems: 2,
          minItems: 2,
          type: "array",
        },
        emptyArrray: {
          maxItems: 0,
          minItems: 0,
          type: "array",
        },
        multiArray: {
          items: {
            anyOf: [
              {
                maxLength: 5,
                minLength: 5,
                type: "string",
              },
              {
                maximum: 5,
                minimum: 5,
                type: "integer",
              },
            ],
          },
          maxItems: 3,
          minItems: 3,
          type: "array",
        },
        nested: {
          properties: {
            one: {
              maxLength: 3,
              minLength: 3,
              type: "string",
            },
          },
          required: ["one"],
          type: "object",
        },
        null: {
          type: "null",
        },
        password: {
          maxLength: 16,
          minLength: 16,
          type: "string",
        },
        somethingElseStringArray: {
          items: {
            maxLength: 5,
            minLength: 5,
            type: "string",
          },
          maxItems: 1,
          minItems: 1,
          type: "array",
        },
        type: {
          maxLength: 5,
          minLength: 5,
          type: "string",
        },
        username: {
          format: "email",
          type: "string",
        },
        wasFetch: {
          type: "boolean",
        },
      },
      required: [
        "type",
        "username",
        "password",
        "somethingElseStringArray",
        "multiArray",
        "emptyArrray",
        "nested",
        "bo",
        "null",
        "complexArray",
        "wasFetch",
      ],
      type: "object",
    })

    // response schema
    expect(operation.response.body?.contentSchema).toStrictEqual({
      properties: {
        status: {
          maxLength: 2,
          minLength: 2,
          type: "string",
        },
      },
      required: ["status"],
      type: "object",
    })
  })

  it.todo("should should correctly report empty bodies")
  it.todo("should retry on error")
})
