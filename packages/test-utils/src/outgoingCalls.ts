export async function makeHttpRequest(
  key: string,
  url: string = "https://httpbin.org/anything",
) {
  return new Promise(async (resolve, reject) => {
    const https = await import("node:https")
    const httpRequest = https.request(
      url,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      (httpResponse) => {
        let data = ""
        httpResponse.on("data", (chunk) => {
          data += chunk
        })
        httpResponse.on("end", () => resolve(data))
      },
    )
    httpRequest.on("error", (error) => reject(error))
    httpRequest.write(JSON.stringify({ "http.request": "http.request", key }))
    httpRequest.end()
  })
}

export async function makeFetchRequest(
  key: string,
  url: string = "https://httpbin.org/anything",
) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({ fetch: "fetch", key }),
    headers: { "Content-Type": "application/json" },
  })
}

export async function makeOutgoingCalls(
  key: string,
  url: string = "https://httpbin.org/anything",
) {
  await Promise.all([makeHttpRequest(key, url), makeFetchRequest(key, url)])
}
