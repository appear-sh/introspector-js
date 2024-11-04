import { IncomingMessage, ServerResponse } from "http"
import { EventEmitter } from "events"

import {
  APPEAR_SYMBOL,
  INTROSPECTOR_EMITTER_SYMBOL,
  INTROSPECTOR_HOOKED_SYMBOL,
} from "./hook/symbol"
import { GlobalAppear } from "./global"

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
    const originalWrite = res.write.bind(res)
    const originalEnd = res.end.bind(res)
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

  let body = null

  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await readBodyFromRequest(req)
  }

  return new Request(url, {
    method: req.method,
    headers: headers,
    body,
  })
}

export async function serverResponseToResponse(
  res: ServerResponse<IncomingMessage>,
): Promise<Response> {
  // MUST read the body first, as headers etc are likely sent before this.
  const body = await readBodyFromResponse(res)

  const headers = new Headers()
  const outgoingHeaders = res.getHeaders()
  for (const [headerName, headerValue] of Object.entries(outgoingHeaders)) {
    if (headerValue) {
      headers.append(
        headerName,
        Array.isArray(headerValue)
          ? headerValue.join(", ")
          : String(headerValue),
      )
    }
  }

  return new Response(body, {
    status: res.statusCode,
    statusText: res.statusMessage,
    headers,
  })
}

// Typescript doesn't seem to support using symbols as
// accessor keys for globalThis, so we need to cast to any.

export function setGlobalAppear(emitter: EventEmitter) {
  ;(globalThis as any)[APPEAR_SYMBOL] = {
    [INTROSPECTOR_EMITTER_SYMBOL]: emitter,
    [INTROSPECTOR_HOOKED_SYMBOL]: true,
  }
}

export function getGlobalAppear(): GlobalAppear {
  return (
    (globalThis as any)[APPEAR_SYMBOL] ?? {
      [INTROSPECTOR_EMITTER_SYMBOL]: new EventEmitter(),
      [INTROSPECTOR_HOOKED_SYMBOL]: false,
    }
  )
}
