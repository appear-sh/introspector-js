export const register = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerAppear } = await import("@appear.sh/introspector/nextjs")
    registerAppear({
      apiKey: "test-key",
      environment: "test",
      serviceName: "nextjs-instrumentation-ts-test",
      reporting: { endpoint: process.env.COLLECTOR_URL },
    })
  }
}
