import stringify from "fast-json-stable-stringify"

export function formatTraceOperations(operations: any[]) {
  return operations
    .map((op) => {
      op.request.uri = op.request.uri.replace(/:\d+/, ":PORT")
      return op
    })
    .toSorted((a, b) => stringify(a).localeCompare(stringify(b)))
}
