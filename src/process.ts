import { ResolvedAppearConfig } from "./config"
import { schemaFromValue } from "./contentTypes/contentTypes"
import { StringSchemaType } from "./contentTypes/jsonSchema.types"
import { isNonNullable } from "./helpers"
import { Operation } from "./report"

const getBodySchema = async (input: Request | Response) => {
  const clone = input.clone()
  if (!clone.body) return null

  const contentMediaType = clone.headers
    .get("content-type")
    ?.toLowerCase()
    ?.split(";")[0]
    ?.trim()

  if (/application\/(?:.*\+)?json/.test(contentMediaType ?? "")) {
    // application/json;
    // application/something+json;
    // application/vnd.something-other+json;
    const contentSchema = schemaFromValue(await clone.json(), "in:body")
    if (!contentSchema) return null
    return {
      type: "string" as const,
      contentSchema,
      contentMediaType: contentMediaType!,
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

export const process = async (
  req: Request,
  res: Response,
  config: ResolvedAppearConfig,
): Promise<Operation> => {
  const requestBody = await getBodySchema(req)
  const responseBody = await getBodySchema(res)

  const requestHeadersSchemaEntries = [...req.headers.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:header") as
        | StringSchemaType
        | undefined
      return schema ? ([name, schema] as const) : undefined
    })
    .filter(isNonNullable)

  const responseHeadersSchemaEntries = [...res.headers.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:header") as
        | StringSchemaType
        | undefined
      return schema ? ([name, schema] as const) : undefined
    })
    .filter(isNonNullable)

  const query = [...new URL(req.url, "http://localhost").searchParams.entries()]
    .map(([name, value]) => {
      const schema = schemaFromValue(value, "in:query")
      return schema ? [name, schema] : undefined
    })
    .filter(isNonNullable)

  return {
    request: {
      method: req.method,
      uri: req.url.split("?")[0]!, // remove query so we don't send raw values
      headers: Object.fromEntries(requestHeadersSchemaEntries),
      query: Object.fromEntries(query),
      body: requestBody,
    },
    response: {
      headers: Object.fromEntries(responseHeadersSchemaEntries),
      statusCode: res.status,
      body: responseBody,
    },
  }
}
