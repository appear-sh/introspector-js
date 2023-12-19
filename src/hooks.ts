import { BatchInterceptor, Interceptor } from "@mswjs/interceptors";
import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import * as jsEnv from "browser-or-node";

import { type Payload, type Primitive, type Operation } from "./";

import { AppearConfig, InternalConfig } from "./config";
import { identifyType } from "./contentType";

export async function hook(
  config: AppearConfig,
  internalConfig: InternalConfig,
  captureOperation: (operation: Operation) => void
) {
  const interceptors: Interceptor<any>[] = [new FetchInterceptor()];

  if (jsEnv.isBrowser && !config.disableXHRHook) {
    const { XMLHttpRequestInterceptor } = await import(
      "@mswjs/interceptors/XMLHttpRequest"
    );
    interceptors.push(new XMLHttpRequestInterceptor());
  }

  if (jsEnv.isNode) {
    const { ClientRequestInterceptor } = await import(
      "@mswjs/interceptors/ClientRequest"
    );
    interceptors.push(new ClientRequestInterceptor());
  }

  const interceptor = new BatchInterceptor({
    name: "appear-introspector",
    interceptors,
  });

  interceptor.apply();

  const requests = new Map();

  // Workaround for https://github.com/mswjs/interceptors/issues/419
  interceptor.on("request", ({ request, requestId }) => {
    requests.set(requestId, request.clone());
  });

  interceptor.on("response", async ({ requestId, response }) => {
    const clonedRequest: Request = requests.get(requestId);
    const clonedResponse: Response = response.clone();

    if (!clonedRequest) {
      throw new Error("Could not find corresponding request for response.");
    } else {
      requests.delete(requestId);
    }

    if (clonedRequest.url === internalConfig.reportingEndpoint) {
      // Ignore our own outbound requests.
      return;
    }

    if (
      // Fetch & XHR
      clonedRequest.destination !== ""
    ) {
      // Probably something we don't care about, ignore.
      return;
    }

    const url = clonedRequest.url;

    let requestBody = clonedRequest.body;
    let responseBody = clonedResponse.body;

    if (
      clonedRequest.headers.get("content-type")?.includes("application/json")
    ) {
      requestBody = await clonedRequest.json();
    }

    if (
      clonedResponse.headers.get("content-type")?.includes("application/json")
    ) {
      responseBody = await clonedResponse.json();
    } else {
      // Ignore anything that isn't a JSON payload response right now.
      return;
    }

    const sanitisedRequestBody = mapPopulatedBodyToPayload(requestBody);
    const sanitisedResponseBody = mapPopulatedBodyToPayload(responseBody);

    const sanitisedRequestHeaders = [...clonedRequest.headers.entries()].map(
      ([name, value]) =>
        [name, identifyType(value, name)?.type ?? "string"] as const
    );

    const sanitisedResponseHeaders = [...clonedResponse.headers.entries()].map(
      ([name, value]) =>
        [name, identifyType(value, name)?.type ?? "string"] as const
    );

    const query = [
      ...new URL(url, "http://localhost").searchParams.entries(),
    ].map(
      ([key, value]) =>
        [key, identifyType(value, key)?.type ?? "string"] as const
    );

    const operation: Operation = {
      request: {
        method: clonedRequest.method,
        uri: url,
        headers: sanitisedRequestHeaders,
        query: query,
        body: sanitisedRequestBody,
        bodyType: clonedRequest.headers.get("content-type"),
      },
      response: {
        headers: sanitisedResponseHeaders,
        body: sanitisedResponseBody,
        statusCode: clonedResponse.status,
        bodyType: clonedResponse.headers.get("content-type"),
      },
    };

    captureOperation(operation);
  });
}

function isPrimitive(value: any): value is Primitive {
  const validPrimitives = ["string", "number", "boolean", "undefined", "null"];
  return validPrimitives.includes(typeof value) || value === null;
}

function getType(value: any): Primitive {
  if (value === null) return "null";
  return typeof value as Primitive;
}

function mapPopulatedBodyToPayload(body: any, propName?: string): Payload {
  if (isPrimitive(body)) {
    return (identifyType(body, propName)?.type as Primitive) || getType(body);
  }

  if (Array.isArray(body)) {
    const types: string[] = [];
    body.forEach((item) =>
      types.push(mapPopulatedBodyToPayload(item, propName) as Primitive)
    );

    return types as Payload;
  }

  if (typeof body === "object" && body !== null) {
    const result: { [name: string]: Payload } = {};
    for (const key in body) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        result[key] = mapPopulatedBodyToPayload(body[key], key);
      }
    }
    return result;
  }

  throw new Error(`Unknown type ${typeof body}`);
}
