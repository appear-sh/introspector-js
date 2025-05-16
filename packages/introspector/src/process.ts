import { schemaFromValue } from "./contentTypes/contentTypes.js"
import { StringSchemaType } from "./contentTypes/jsonSchema.types.js"
import { isNonNullable } from "./helpers.js"
import { Operation } from "./report.js"

const getBodySchema = async (input: Request | Response) => {
  const clone = input.clone()
  if (!clone.body) return null

  const contentMediaType = clone.headers
    .get("content-type")
    ?.toLowerCase()
    ?.split(";")[0]
    ?.trim()

  if (
    !contentMediaType ||
    /application\/(?:.*\+)?json/.test(contentMediaType)
  ) {
    // application/json;
    // application/something+json;
    // application/vnd.something-other+json;

    // we opportunistically try to parse the body as json even if the content-type is not set
    // because it's not uncommon for APIs not to set any content-type and just send a json body
    try {
      const jsonBody = await clone.json()
      const contentSchema = schemaFromValue(jsonBody, "in:body")
      if (!contentSchema) return null
      return {
        type: "string" as const,
        contentSchema,
        contentMediaType: contentMediaType!,
      }
    } catch (e) {
      // Ignore this request.
      return null
    }
  } else if (/application\/(?:.*\+)?xml/.test(contentMediaType ?? "")) {
    // application/xml;
    // application/something+xml;
    // application/vnd.something-other+xml;
    // todo add xml parsing
    return { type: "string" as const, contentMediaType: contentMediaType! }
  } else if (contentMediaType?.includes("text/")) {
    return { type: "string" as const, contentMediaType: contentMediaType! }
  }
  // todo add other types

  // unknown type
  return null
}

const parseUrl = (request: Request) => {
  const urlObject = new URL(request.url, "http://localhost")

  if (request.headers.get("x-forwarded-host")) {
    urlObject.host = request.headers.get("x-forwarded-host")!
  }
  if (request.headers.get("x-forwarded-proto")) {
    urlObject.protocol = request.headers.get("x-forwarded-proto")!
  }
  if (request.headers.get("x-forwarded-port")) {
    urlObject.port = request.headers.get("x-forwarded-port")!
  }
  if (urlObject.hostname === "127.0.0.1") {
    urlObject.hostname = "localhost"
  }

  return urlObject
}

export const process = async ({
  request,
  response,
  direction,
}: {
  request: Request
  response: Response
  direction: "incoming" | "outgoing"
}): Promise<Operation> => {
  const requestBody = await getBodySchema(request)
  const responseBody = await getBodySchema(response)

  const requestHeadersSchemaEntries = [...request.headers.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:header") as
        | StringSchemaType
        | undefined
      return schema ? ([name, schema] as const) : undefined
    })
    .filter(isNonNullable)

  const responseHeadersSchemaEntries = [...response.headers.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:header") as
        | StringSchemaType
        | undefined
      return schema ? ([name, schema] as const) : undefined
    })
    .filter(isNonNullable)

  const urlObject = parseUrl(request)

  const query = [...urlObject.searchParams.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:query")
      return schema ? [name, schema] : undefined
    })
    .filter(isNonNullable)

  return {
    direction,
    request: {
      method: request.method,
      uri: urlObject.href.split("?")[0]!,
      headers: Object.fromEntries(requestHeadersSchemaEntries),
      query: Object.fromEntries(query),
      body: requestBody,
    },
    response: {
      headers: Object.fromEntries(responseHeadersSchemaEntries),
      statusCode: response.status,
      body: responseBody,
    },
  }
}
