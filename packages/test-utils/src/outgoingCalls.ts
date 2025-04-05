export async function makeHttpRequest() {
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
    httpRequest.write(JSON.stringify({ "http.request": "http.request" }))
    httpRequest.end()
  })
}

export async function makeFetchRequest() {
  return fetch("https://httpbin.org/anything", {
    method: "POST",
    body: JSON.stringify({ fetch: "fetch" }),
    headers: { "Content-Type": "application/json" },
  })
}

export async function makeOutgoingCalls() {
  await Promise.all([makeHttpRequest(), makeFetchRequest()])
}
