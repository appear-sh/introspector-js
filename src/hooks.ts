import {
  type Payload,
  type Primitive,
  type Operation,
  captureOperation,
} from "./";

export function hookFetch(): typeof fetch {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: any, init?: any) => {
    const response = await originalFetch(input, init);
    const url =
      input instanceof URL
        ? input.href
        : typeof input === "string"
        ? input
        : input.url;

    const clonedResponse = response.clone();

    let requestBody = init?.body;

    // TODO only try this if content-type headers are set?
    try {
      requestBody = JSON.parse(requestBody);
    } catch (e) {
      // ignore
    }

    const sanitisedRequestBody = mapPopulatedBodyToPayload(requestBody);
    const sanitisedResponseBody = mapPopulatedBodyToPayload(
      await clonedResponse.json()
    );

    const operation: Operation = {
      request: {
        method: init?.method ?? "GET",
        uri: url,
        headers: init?.headers as Record<string, Primitive>,
        query: {},
        body: sanitisedRequestBody,
      },
      response: {
        headers: Object.fromEntries(clonedResponse.headers.entries()),
        body: sanitisedResponseBody,
        statusCode: clonedResponse.status,
      },
    };

    captureOperation(operation);

    return response;
  }) as typeof globalThis.fetch;

  return originalFetch;
}

export function hookXMLHttpRequest() {
  class ExtendedXMLHttpRequest extends XMLHttpRequest {
    _method?: string;
    _url?: string | URL;
  }

  const originalSend = ExtendedXMLHttpRequest.prototype.send;
  const originalOpen = ExtendedXMLHttpRequest.prototype.open;

  ExtendedXMLHttpRequest.prototype.open = function (method, url) {
    this._method = method; // store method and URL for later use
    this._url = url;
    return originalOpen.apply(this, arguments as any);
  };

  ExtendedXMLHttpRequest.prototype.send = function (body) {
    const _method = this._method!;
    const _url = this._url!;

    this.addEventListener("load", function () {
      const urlString = typeof _url === "string" ? _url : _url.href;

      const operation: Operation = {
        request: {
          method: _method,
          uri: urlString,
          headers: {}, // XMLHttpRequest does not expose headers directly
          query: {}, // Likewise, query parameters are not exposed
          body: mapPopulatedBodyToPayload(body),
        },
        response: {
          headers: mapHeadersToRecord(this.getAllResponseHeaders()),
          body: mapPopulatedBodyToPayload(this.responseText),
          statusCode: this.status,
        },
      };

      captureOperation(operation);
    });
    return originalSend.apply(this, arguments as any);
  };

  window.XMLHttpRequest = ExtendedXMLHttpRequest;
}

function mapHeadersToRecord(headers: string): Record<string, string> {
  const arr = headers.trim().split(/[\r\n]+/);

  // Create a map of header names to values
  const headerMap: Record<string, string> = {};
  arr.forEach((line) => {
    const parts = line.split(": ");
    const header = parts.shift();

    // TODO: handle this more gracefully
    if (!header) throw new Error("Somehow we got an undefined header value");

    const value = parts.join(": ");
    headerMap[header] = value;
  });

  return headerMap;
}

function isPrimitive(value: any): value is Primitive {
  const validPrimitives = ["string", "number", "boolean", "undefined", "null"];
  return validPrimitives.includes(typeof value) || value === null;
}

function getType(value: any): Primitive {
  if (value === null) return "null";
  return typeof value as Primitive;
}

function mapPopulatedBodyToPayload(body: any): Payload {
  if (isPrimitive(body)) {
    return getType(body);
  }

  if (Array.isArray(body)) {
    const types: string[] = [];
    body.forEach((item) =>
      types.push(mapPopulatedBodyToPayload(item) as Primitive)
    );

    return types as Payload;

    // Below is for typescript type arrays.
    // const arrayType = [...uniqueTypes];
    // if (arrayType.length === 0) arrayType.push("never");

    // let type = arrayType.join(" | ");

    // if (arrayType.length > 1) {
    //   type = `(${type})`;
    // }

    // return `${type}[]` as Payload;
  }

  if (typeof body === "object" && body !== null) {
    const result: { [name: string]: Payload } = {};
    for (const key in body) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        result[key] = mapPopulatedBodyToPayload(body[key]);
      }
    }
    return result;
  }

  throw new Error(`Unknown type ${typeof body}`);
}
