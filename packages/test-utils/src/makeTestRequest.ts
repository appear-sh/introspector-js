export async function makeTestRequest(
  port: number,
  path: string = "/api/test",
) {
  const response = await fetch(`http://localhost:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: "data" }),
  })

  if (response.headers.get("content-type")?.includes("application/json")) {
    const data = (await response.json()) as { message: string }
    return { response, data }
  } else {
    const data = await response.text()
    return { response, data }
  }
}
