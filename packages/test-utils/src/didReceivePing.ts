export function didReceivePing(traces: any[]) {
  return traces.some((trace) => trace.endpoint.endsWith("/ping"))
}
