import { BatchInterceptor, Interceptor } from "@mswjs/interceptors";
import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import * as jsEnv from "browser-or-node";

import {
  type Payload,
  type Primitive,
  type Operation,
  captureOperation,
} from "./";

import { InternalConfig } from "./config";

export async function hook(internalConfig: InternalConfig) {
  const interceptors: Interceptor<any>[] = [new FetchInterceptor()];

  if (jsEnv.isBrowser) {
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
    const clonedRequest = requests.get(requestId);
    const clonedResponse = response.clone();

    if (!clonedRequest) {
      throw new Error("Could not find corresponding request for response.");
    } else {
      requests.delete(requestId);
    }

    if (clonedRequest.url === internalConfig.reportingEndpoint) {
      // Ignore our own outbound requests.
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
    }

    const sanitisedRequestBody = mapPopulatedBodyToPayload(requestBody);
    const sanitisedResponseBody = mapPopulatedBodyToPayload(responseBody);

    const operation: Operation = {
      request: {
        method: clonedRequest.method,
        uri: url,
        headers: Object.fromEntries(clonedRequest.headers.entries()),
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
