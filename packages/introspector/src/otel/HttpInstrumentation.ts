import { Span } from "@opentelemetry/api"
import {
  HttpInstrumentationConfig,
  HttpInstrumentation as OgHttpInstrumentation,
} from "@opentelemetry/instrumentation-http"
import {
  type ClientRequest,
  IncomingMessage,
  type OutgoingMessage,
  type ServerResponse,
} from "http"
import { AppearConfig, resolveConfig, ResolvedAppearConfig } from "../config.js"
import { process } from "../process.js"

export class HttpInstrumentation extends OgHttpInstrumentation {
  protected appearConfig: ResolvedAppearConfig
  constructor(config: HttpInstrumentationConfig & AppearConfig) {
    super({
      ...config,
      requestHook: (span, req) => {
        if (this.appearConfig.debug)
          console.debug("[Appear] HTTPInstrumentation detected a request")
        this._requestHook(span, req)
        config.requestHook?.(span, req)
      },
      responseHook: async (span, res) => {
        this._responseHook(span, res)
        config.responseHook?.(span, res)
      },
    })
    this.appearConfig = resolveConfig(config)
  }

  protected _requestHook(
    span: Span,
    req: ClientRequest | IncomingMessage,
  ): void {
    // capture request body for processing
    if (req instanceof IncomingMessage) {
      readIncomingMessageBody(req)
    } else {
      readOutgoingMessageBody(req)
    }
  }

  protected async _responseHook(
    span: Span,
    res: IncomingMessage | ServerResponse,
  ): Promise<void> {
    // prevent span from ending before we process the operation and set the operation attribute
    const endSpan = span.end
    let spanEndTime: Parameters<typeof endSpan>[0]
    span.end = (endTime) => {
      spanEndTime = endTime
    }

    // @ts-ignore
    const req: IncomingMessage | ClientRequest = res.req

    const [request, response] = await Promise.all([
      req instanceof IncomingMessage
        ? incomingMessageToRequest(req)
        : clientRequestToRequest(req),
      res instanceof IncomingMessage
        ? incomingMessageToResponse(res)
        : serverResponseToResponse(res),
    ])

    // this runs after response was sent, it's ok to do processsing here
    if (
      !this.appearConfig.interception.filter(
        request,
        response,
        this.appearConfig,
      )
    ) {
      if (this.appearConfig.debug)
        console.debug(`[Appear] Request to ${request.url} was filtered out`)
      return
    }

    const operation = await process({
      request,
      response,
      // @ts-ignore kind is missing in span type definition, 1=server, 2=client
      direction: span.kind === 1 ? "incoming" : "outgoing",
    })
    span.setAttribute("appear.operation", JSON.stringify(operation))
    endSpan.apply(span, [spanEndTime])
  }
}

export const bodySymbol = Symbol("body")

export async function readIncomingMessageBody(
  resReq: IncomingMessage & {
    [bodySymbol]?: Promise<string | null>
  },
): Promise<string | null> {
  if (resReq[bodySymbol]) return resReq[bodySymbol]
  resReq[bodySymbol] = new Promise((resolve) => {
    const chunks: Buffer[] = []

    resReq.prependListener("data", (chunk: Buffer | string) => {
      chunks.push(
        typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk,
      )
    })

    resReq.prependListener("end", () => {
      if (chunks.length === 0) return resolve(null)
      // responses have full serialized object in data instead of just body
      resolve(Buffer.concat(chunks).toString())
    })
  })
  return resReq[bodySymbol]
}

export function readOutgoingMessageBody(
  res: OutgoingMessage & { [bodySymbol]?: Promise<string | null> },
): Promise<string | null> {
  if (res[bodySymbol]) return res[bodySymbol]
  res[bodySymbol] = new Promise((resolve) => {
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

    res.end = function (chunk: any, ...args: any[]): OutgoingMessage {
      if (chunk) chunks.push(Buffer.from(chunk))
      resolve(Buffer.concat(chunks).toString())

      const encoding = args[0] || "utf8"
      return originalEnd.call(res, chunk, encoding, ...args.slice(1))
    }
  })
  return res[bodySymbol]
}

export async function incomingMessageToRequest(
  req: IncomingMessage & { [bodySymbol]?: Promise<string | null> },
): Promise<Request> {
  const protocol = (req.headers["x-forwarded-proto"] as string) || "http"
  const host = req.headers.host
  const url = `${protocol}://${host}${req.url}`

  const headers = new Headers(req.headers as Record<string, string>)

  let body = null

  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req[bodySymbol]
  }

  return new Request(url, {
    method: req.method,
    headers: headers,
    body,
  })
}

export async function clientRequestToRequest(
  req: ClientRequest & { [bodySymbol]?: Promise<string | null> },
): Promise<Request> {
  const url = new URL(req.path, `${req.protocol}//${req.host}`)

  // convert headers
  const headers = new Headers()
  for (const headerName in req.getHeaders()) {
    const headerValue = req.getHeader(headerName)
    if (typeof headerValue === "string") headers.append(headerName, headerValue)
    else if (Array.isArray(headerValue))
      headerValue.forEach((value) => headers.append(headerName, value))
  }

  let body = null

  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req[bodySymbol]
  }

  return new Request(url, {
    method: req.method,
    headers: headers,
    body,
  })
}

function canHaveBody(statusCode?: number) {
  // Status codes that should not have a body according to HTTP and Fetch API specifications
  const statusCodesWithoutBody = [204, 205, 304]
  if (
    statusCode &&
    statusCode >= 200 &&
    !statusCodesWithoutBody.includes(statusCode)
  ) {
    return true
  }
  return false
}

export async function serverResponseToResponse(
  res: ServerResponse<IncomingMessage>,
): Promise<Response> {
  // MUST read the body first, as headers etc are likely sent before this.
  const body = await readOutgoingMessageBody(res)
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

  return new Response(canHaveBody(res.statusCode) ? body : null, {
    status: res.statusCode,
    statusText: res.statusMessage,
    headers,
  })
}

export async function incomingMessageToResponse(
  res: IncomingMessage,
): Promise<Response> {
  const headers = new Headers(res.headers as Record<string, string>)
  const body = await readIncomingMessageBody(res)

  return new Response(canHaveBody(res.statusCode) ? body : null, {
    headers,
    status: res.statusCode,
    statusText: res.statusMessage,
  })
}
