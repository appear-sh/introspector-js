import { describe, expect, it, test } from "vitest"
import { getType, schemaFromValue, mergeSchemas } from "./contentTypes"

describe("content type helpers", () => {
  describe("getType", () => {
    it("should return type based on name", () => {
      const type = getType("boolean")
      expect(type).toMatchObject({ type: "boolean" })
    })
    it("should return type based on alias", () => {
      const type = getType("int")
      expect(type).toMatchObject({ type: "integer" })
    })
  })
  describe("identify & create schema if content types", () => {
    test.each([
      { value: null, schema: { type: "null" } },
      { value: true, schema: { type: "boolean" } },
      {
        value: 3.14,
        schema: { type: "number", minimum: 3, maximum: 4, multipleOf: 0.01 },
      },
      { value: 42, schema: { type: "integer", maximum: 50, minimum: 40 } },
      // number can't be returned from identifyType because float or int will match first
      { value: "true", schema: { type: "string", format: "boolean" } },
      {
        value: "2b03be0c-ff7c-4507-ba63-7d62c5308a4a",
        schema: { type: "string", format: "uuid" },
      },
      {
        value: "2024-04-05",
        schema: { type: "string", format: "date" },
      },
      {
        value: "2024-04-05T10:10:10.000Z",
        schema: { type: "string", format: "date-time" },
      },
      {
        value: "Mon, 05 Apr 2024 10:10:10 GMT",
        schema: { type: "string", format: "utc-date-time" },
      },
      {
        value: "73ae28",
        schema: { type: "string", format: "hex" },
      },
      {
        value: "c3VycHJpc2U=",
        schema: { type: "string", format: "base64" },
      },
      {
        value: "git@github.com:appear-sh/app.git",
        schema: { type: "string", format: "git-uri" },
      },
      {
        value: "https://github.com/appear-sh/app",
        schema: { type: "string", format: "uri" },
      },
      {
        value: "jakub@appear.sh",
        schema: { type: "string", format: "email" },
      },
      {
        value: "contentType.test.ts",
        schema: { type: "string", format: "filename" },
      },
      {
        value: "some super random string",
        schema: { type: "string", minLength: 24, maxLength: 24 },
      },
      {
        value: ["one", "two", "three"],
        schema: {
          type: "array",
          items: { type: "string", minLength: 3, maxLength: 5 },
          minItems: 3,
          maxItems: 3,
        },
      },
      {
        value: [],
        schema: {
          type: "array",
          minItems: 0,
          maxItems: 0,
        },
      },
      {
        value: ["string", 42],
        schema: {
          type: "array",
          items: { anyOf: [{ type: "string" }, { type: "integer" }] },
        },
      },
      {
        value: { first: 1, second: "two" },
        schema: {
          type: "object",
          properties: {
            first: { type: "integer" },
            second: { type: "string" },
          },
          required: ["first", "second"],
        },
      },
    ])("from: $value", ({ value, schema }) => {
      const detected = schemaFromValue(value)
      expect(detected).toMatchObject(schema)
    })
  })

  describe("merge schemas", () => {
    it("should dedupe same types", () => {
      const merged = mergeSchemas(
        { type: "string", format: "email" },
        { type: "string", format: "email" },
      )
      expect(merged).toMatchObject([{ type: "string", format: "email" }])
    })
    it("should merge float and int to number", () => {
      const merged = mergeSchemas(
        { type: "number", minimum: 3, maximum: 4, multipleOf: 0.01 },
        { type: "integer", minimum: 1, maximum: 2 },
      )
      expect(merged).toMatchObject([{ type: "number", minimum: 1, maximum: 4 }])
    })
    it("should email and uuid to string", () => {
      const merged = mergeSchemas(
        { type: "string", format: "email" },
        { type: "string", format: "uuid" },
      )
      expect(merged).toMatchObject([{ type: "string" }])
    })
    it("should merge arrays", () => {
      const merged = mergeSchemas(
        { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
        {
          type: "array",
          items: { anyOf: [{ type: "number" }, { type: "boolean" }] },
          minItems: 1,
          maxItems: 3,
        },
      )
      expect(merged).toMatchObject([
        {
          type: "array",
          items: {
            anyOf: [
              { type: "number" },
              { type: "boolean" },
              { type: "string" },
            ],
          },
          minItems: 1,
          maxItems: 5,
        },
      ])
    })
    it("should merge objects", () => {
      const merged = mergeSchemas(
        {
          type: "object",
          properties: { first: { type: "string" } },
          required: [],
        },
        {
          type: "object",
          properties: { first: { type: "number" } },
          required: ["first"],
        },
      )
      expect(merged).toMatchObject([
        {
          type: "object",
          properties: {
            first: { anyOf: [{ type: "number" }, { type: "string" }] },
          },
          required: [],
        },
      ])
    })
  })
})
