import {
  SomeSchemaType,
  StringSchemaType,
} from "./contentTypes/jsonSchema.types.js"

export const DEFAULT_REPORTING_ENDPOINT = "https://api.appear.sh/v1/reports"

export type Operation = {
  direction: "incoming" | "outgoing"
  request: {
    origin?: string
    method: string
    uri: string
    headers: Record<string, StringSchemaType>
    query: Record<string, SomeSchemaType>
    body: null | {
      type?: "string"
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentschema
      contentSchema?: SomeSchemaType
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentmediatype
      contentMediaType: string
    }
  }
  response: {
    statusCode: number
    headers: Record<string, StringSchemaType>
    body: null | {
      type?: "string"
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentschema
      contentSchema?: SomeSchemaType
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentmediatype
      contentMediaType: string
    }
  }
}

export type Report = {
  reporter: {
    // meta info about the reporter
    environment: string
    serviceName?: string
  }
  operations: Operation[]
}
