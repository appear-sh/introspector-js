import stringify from "fast-json-stable-stringify"

export function formatTraceOperations(operations: any[]) {
  return operations
    .map((op) => {
      op.request.uri = op.request.uri.replace(/:\d+/, ":PORT") // port is dynamic so we need to censor it
      if (op.response.body?.contentSchema?.properties?.origin) {
        // origin has port in it so it's dynamic so we set it to plausible value
        op.response.body.contentSchema.properties.origin = {
          maxLength: 12,
          minLength: 12,
          type: "string",
        }
      }
      return op
    })
    .toSorted((a, b) => stringify(a).localeCompare(stringify(b)))
}
