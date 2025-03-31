export async function makeTestRequest(port: number) {
  const response = await fetch(`http://localhost:${port}/api/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: "data" }),
  })

  const data = (await response.json()) as { message: string }
  return { response, data }
}
