import { BatchInterceptor } from "@mswjs/interceptors";
import { ClientRequestInterceptor } from "@mswjs/interceptors/ClientRequest";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";
import { FetchInterceptor } from "@mswjs/interceptors/fetch";

import {
  type Payload,
  type Primitive,
  type Operation,
  captureOperation,
} from "./";

import { APPEAR_REPORTING_ENDPOINT } from "./config";

export function hook() {
  const interceptor = new BatchInterceptor({
    name: "appear-introspector",
    interceptors: [
      new ClientRequestInterceptor(),
      new XMLHttpRequestInterceptor(),
      new FetchInterceptor(),
    ],
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

    if (clonedRequest.url === APPEAR_REPORTING_ENDPOINT) {
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
