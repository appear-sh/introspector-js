import { Span } from "@opentelemetry/api"
import {
  UndiciInstrumentation as OgUndiciInstrumentation,
  UndiciInstrumentationConfig,
  UndiciRequest,
  UndiciResponse,
} from "@opentelemetry/instrumentation-undici"
import { AppearConfig, resolveConfig, ResolvedAppearConfig } from "../config.js"
import { process } from "../process.js"

export class UndiciInstrumentation extends OgUndiciInstrumentation {
  protected appearConfig: ResolvedAppearConfig
  constructor(config: UndiciInstrumentationConfig & AppearConfig) {
    super({
      ...config,
      responseHook: async (span, res) => {
        this._responseHook(span, res)
        config.responseHook?.(span, res)
      },
    })
    this.appearConfig = resolveConfig(config)
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
        const request = this.undiciRequestToRequest(undici.request)
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
        )
          return

        process({
          request,
          response,
          direction: "outgoing",
        })
          .then((operation) => {
            span.setAttribute("appear.operation", JSON.stringify(operation))
          })
          .finally(() => endSpan.apply(span, [spanEndTime]))
      } catch (e) {}
      return ogOnComplete.apply(handler, args)
    }
  }

  protected undiciRequestToRequest(undiciRequest: UndiciRequest): Request {
    const url = new URL(undiciRequest.path, undiciRequest.origin)

    return new Request(url, {
      method: undiciRequest.method,
      headers: this.readUndiciHeaders(undiciRequest.headers),
      body: undiciRequest.body,
      // @ts-ignore
      duplex: "half",
    })
  }

  protected undiciResponseToResponse(
    body: Buffer,
    undiciResponse: UndiciResponse,
  ): Response {
    return new Response(body, {
      status: undiciResponse.statusCode,
      statusText: undiciResponse.statusText,
      headers: this.readUndiciHeaders(undiciResponse.headers),
    })
  }

  protected readUndiciHeaders(input: string | string[] | Buffer[]): Headers {
    const headers = new Headers()
    const headersArray = Array.isArray(input) ? input : input.split("\r\n")
    while (headersArray.length > 0) {
      const header = headersArray.shift()
      const value = headersArray.shift()
      if (header && value !== undefined)
        headers.append(header.toString(), value.toString())
    }

    return headers
  }
}
