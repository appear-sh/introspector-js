import { describe, it, expect } from "vitest"
import { process } from "./process.js"

describe("process", () => {
  describe("request url normalization", () => {
    it("should normalize localhost", async () => {
      const req = new Request("http://127.0.0.1:3000/api/test?foo=bar")
      const op = await process({
        request: req,
        response: new Response(),
        direction: "incoming",
      })
      expect(op.request.uri).toBe("http://localhost:3000/api/test")
    })

    it("should remove unnecessary ports", async () => {
      const req = new Request("https://localhost:443/api/test?foo=bar")
      const op = await process({
        request: req,
        response: new Response(),
        direction: "incoming",
      })
      expect(op.request.uri).toBe("https://localhost/api/test")
    })

    it("should normalize forwarded headers", async () => {
      const req = new Request("http://127.0.0.1:3000/api/test?foo=bar", {
        headers: {
          "x-forwarded-host": "example.com",
          "x-forwarded-proto": "https",
          "x-forwarded-port": "443",
        },
      })
      const op = await process({
        request: req,
        response: new Response(),
        direction: "incoming",
      })
      expect(op.request.uri).toBe("https://example.com/api/test")
    })

    it("should use host header if it's set", async () => {
      const req = new Request("http://127.0.0.1:3000/api/test?foo=bar", {
        headers: { host: "example.com:4000" },
      })
      const op = await process({
        request: req,
        response: new Response(),
        direction: "incoming",
      })
      expect(op.request.uri).toBe("http://example.com:4000/api/test")
    })
  })

  describe("body schema", () => {
    it("should process a simple JSON request/response", async () => {
      const req = new Request("http://127.0.0.1:3000/api/test?foo=bar", {
        method: "POST",
        headers: { "content-type": "application/json", "x-custom": "abc" },
        body: JSON.stringify({ hello: "world" }),
      })
      const res = new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json", "x-res": "xyz" },
      })

      const op = await process({
        request: req,
        response: res,
        direction: "incoming",
      })

      expect(op).toMatchSnapshot()
      expect(op.direction).toBe("incoming")
      expect(op.request.method).toBe("POST")
      expect(op.request.uri).toBe("http://localhost:3000/api/test")
      expect(op.request.headers).toHaveProperty("x-custom")
      expect(op.request.query).toHaveProperty("foo")
      expect(op.request.body).toMatchObject({
        type: "string",
        contentMediaType: "application/json",
      })
      expect(op.response.statusCode).toBe(200)
      expect(op.response.headers).toHaveProperty("x-res")
      expect(op.response.body).toMatchObject({
        type: "string",
        contentMediaType: "application/json",
      })
    })

    it("should handle missing content-type and parse as JSON if possible", async () => {
      const req = new Request("http://localhost/api/other", {
        method: "POST",
        body: JSON.stringify({ foo: 123 }),
      })
      const res = new Response("not json")
      const op = await process({
        request: req,
        response: res,
        direction: "outgoing",
      })
      expect(op.request.body).toMatchObject({
        type: "string",
        contentMediaType: "text/plain",
      })
      expect(op.response.body).toMatchObject({
        type: "string",
        contentMediaType: "text/plain",
      })
    })

    it("should handle text response", async () => {
      const req = new Request("http://localhost/api/text", { method: "GET" })
      const res = new Response("hello", {
        status: 200,
        headers: { "content-type": "text/plain" },
      })
      const op = await process({
        request: req,
        response: res,
        direction: "incoming",
      })
      expect(op.response.body).toMatchObject({
        type: "string",
        contentMediaType: "text/plain",
      })
    })
  })
})
