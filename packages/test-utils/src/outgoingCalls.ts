export async function makeHttpRequest(key: string) {
  return new Promise(async (resolve, reject) => {
    const https = await import("node:https")
    const httpRequest = https.request(
      "https://httpbin.org/anything",
      { method: "POST", headers: { "Content-Type": "application/json" } },
      (httpResponse) => {
        let data = ""
        httpResponse.on("data", (chunk) => {
          data += chunk
        })
        httpResponse.on("end", () => resolve(JSON.parse(data)))
      },
    )
    httpRequest.on("error", (error) => reject(error))
    httpRequest.write(JSON.stringify({ "http.request": "http.request", key }))
    httpRequest.end()
  })
}

export async function makeFetchRequest(key: string) {
  return fetch("https://httpbin.org/anything", {
    method: "POST",
    body: JSON.stringify({ fetch: "fetch", key }),
    headers: { "Content-Type": "application/json" },
  })
}

export async function makeOutgoingCalls(key: string) {
  await Promise.all([makeHttpRequest(key), makeFetchRequest(key)])
}
