import { Span } from "@opentelemetry/api"
import {
  UndiciInstrumentation as OgUndiciInstrumentation,
  type UndiciInstrumentationConfig,
  type UndiciRequest as OgUndiciRequest,
  type UndiciResponse,
} from "@opentelemetry/instrumentation-undici"
import { AppearConfig, resolveConfig, ResolvedAppearConfig } from "../config.js"
import { process } from "../process.js"
import { Readable } from "node:stream"

const bodySymbol = Symbol("body")

type UndiciRequest = OgUndiciRequest & {
  [bodySymbol]?: Buffer[] | null
}

export class UndiciInstrumentation extends OgUndiciInstrumentation {
  protected appearConfig: ResolvedAppearConfig
  constructor(config: UndiciInstrumentationConfig & AppearConfig) {
    super({
      ...config,
      requestHook: async (span, req) => {
        this._requestHook(span, req)
        config.requestHook?.(span, req)
      },
      responseHook: async (span, res) => {
        if (this.appearConfig.debug)
          console.debug("[Appear] UndiciInstrumentation detected a request")
        this._responseHook(span, res)
        config.responseHook?.(span, res)
      },
    })
    this.appearConfig = resolveConfig(config)
  }

  // hook into request before it's sent so we can grab body
  protected _requestHook(span: Span, request: UndiciRequest): void {
    request[bodySymbol] = null
    if (!request.body) return

    const ogBodyGenerator = request.body
    request[bodySymbol] = []

    // Create a new generator that will grab chunks and yield them again
    request.body = (async function* () {
      for await (const chunk of ogBodyGenerator) {
        request[bodySymbol]?.push(chunk)
        yield chunk
      }
    })()
  }

  protected _responseHook(
    span: Span,
    undici: { request: UndiciRequest; response: UndiciResponse },
  ): void {
    // hook into the request handler to extract response data for processing
    const symbol = Object.getOwnPropertySymbols(undici.request).find(
      (s) => s.toString() === "Symbol(handler)",
    )
    if (!symbol) return // incompatible undici version, ignore this request

    const handler =
      undici.request[symbol as unknown as keyof typeof undici.request]

    // prevent span from ending before we process the operation and set the operation attribute
    const endSpan = span.end
    let spanEndTime: Parameters<typeof endSpan>[0]
    span.end = (endTime) => {
      spanEndTime = endTime
    }

    // by hooking to onData we extract response data as they are streamed back from server
    const data: Buffer[] = []
    const ogOnData = handler.onData
    handler.onData = (...args: any[]) => {
      data.push(args[0])
      return ogOnData.apply(handler, args)
    }

    // by hooking to onComplete we know response ended and we can process the operation
    const ogOnComplete = handler.onComplete
    handler.onComplete = (...args: any[]) => {
      try {
        const request = this.undiciRequestToRequest(
          undici.request[bodySymbol],
          undici.request,
        )
        const response = this.undiciResponseToResponse(
          Buffer.concat(data),
          undici.response,
        )

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

        process({
          request,
          response,
          direction: "outgoing",
        })
          .then((operation) => {
            span.setAttribute("appear.operation", JSON.stringify(operation))
          })
          .catch((err) => {
            if (this.appearConfig.debug)
              console.error(
                `[Appear] Error processing request`,
                err,
                request,
                response,
              )
          })
          .finally(() => endSpan.apply(span, [spanEndTime]))
      } catch (e) {
        if (this.appearConfig.debug)
          console.error(`[Appear] Error processing request`, e, undici)
      }
      return ogOnComplete.apply(handler, args)
    }
  }

  protected undiciRequestToRequest(
    data: Buffer[] | null | undefined,
    undiciRequest: UndiciRequest,
  ): Request {
    const url = new URL(undiciRequest.path, undiciRequest.origin)

    return new Request(url, {
      method: undiciRequest.method,
      headers: this.readUndiciHeaders(undiciRequest.headers),
      body: data ? Buffer.concat(data) : null,
      // @ts-ignore
      duplex: "half",
    })
  }

  protected undiciResponseToResponse(
    data: Buffer,
    undiciResponse: UndiciResponse,
  ): Response {
    return new Response(data?.toString() || null, {
      status: undiciResponse.statusCode,
      statusText: undiciResponse.statusText,
      headers: this.readUndiciHeaders(undiciResponse.headers),
    })
  }

  protected readUndiciHeaders(input: string | string[] | Buffer[]): Headers {
    const headers = new Headers()
    const headersArray = Array.isArray(input) ? input : input.split("\r\n")
    while (headersArray.length > 0) {
      let header = headersArray.shift()?.toString()
      let value
      if (header?.includes(": ")) {
        ;[header, value] = header.split(": ")
      } else {
        value = headersArray.shift()
      }
      if (header && value !== undefined) {
        headers.append(header.toString(), value.toString())
      }
    }

    return headers
  }
}
