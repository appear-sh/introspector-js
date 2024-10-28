import { IncomingMessage, ServerResponse } from "http"

export const isNonNullable = <T extends any>(
  value: T,
): value is NonNullable<T> => {
  return typeof value !== "undefined" && value !== null
}

export async function readBodyFromRequest(
  req: IncomingMessage,
): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk: Buffer) => chunks.push(chunk))
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString()
      resolve(body)
    })
  })
}

export function readBodyFromResponse(res: ServerResponse): Promise<string> {
  return new Promise((resolve) => {
    const originalWrite = res.write
    const originalEnd = res.end
    const chunks: Buffer[] = []

    res.write = function (
      chunk: any,
      encodingOrCallback?:
        | BufferEncoding
        | ((error: Error | null | undefined) => void),
      callback?: (error: Error | null | undefined) => void,
    ): boolean {
      const encoding = (encodingOrCallback as BufferEncoding) || "utf8"
      chunks.push(Buffer.from(chunk, encoding))
      return originalWrite.call(res, chunk, encoding, callback)
    }

    res.end = function (
      chunk: any,
      ...args: any[]
    ): ServerResponse<IncomingMessage> {
      if (chunk) {
        chunks.push(Buffer.from(chunk))
      }
      const responseBody = Buffer.concat(chunks).toString()

      resolve(responseBody)

      const encoding = args[0] || "utf8"
      return originalEnd.call(res, chunk, encoding, ...args.slice(1))
    }
  })
}

export async function incomingMessageToRequest(
  req: IncomingMessage,
): Promise<Request> {
  const protocol = (req.headers["x-forwarded-proto"] as string) || "http"
  const host = req.headers.host
  const url = `${protocol}://${host}${req.url}`

  const headers = new Headers(req.headers as Record<string, string>)
  const body = await readBodyFromRequest(req)

  return new Request(url, {
    method: req.method,
    headers: headers,
    body,
  })
}

export async function serverResponseToResponse(
  res: ServerResponse<IncomingMessage>,
): Promise<Response> {
  const headers = new Headers()

  res.getHeaderNames().forEach((headerName) => {
    const headerValue = res.getHeader(headerName)
    if (headerValue) {
      if (typeof headerValue === "string" || Array.isArray(headerValue)) {
        headers.append(
          headerName,
          Array.isArray(headerValue) ? headerValue.join(", ") : headerValue,
        )
      }
    }
  })

  const status = res.statusCode || 200
  const statusText = res.statusMessage || "OK"

  const body = await readBodyFromResponse(res)

  return new Response(body, {
    status,
    statusText,
    headers,
  })
}
