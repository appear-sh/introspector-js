import { BatchInterceptor, Interceptor } from "@mswjs/interceptors";
import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import * as jsEnv from "browser-or-node";

import { type Operation } from "./";

import { AppearConfig, InternalConfig } from "./config";
import { findType, getType } from "./contentType";

import { JSONSchema7, JSONSchema7TypeName } from "json-schema";

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

    const sanitisedRequestBody = mapValueToSchema(requestBody);
    const sanitisedResponseBody = mapValueToSchema(responseBody);

    const requestContentType = clonedRequest.headers.get("content-type");
    const responseContentType = clonedResponse.headers.get("content-type");

    if (requestContentType) {
      sanitisedRequestBody.contentMediaType = requestContentType;
    }

    if (responseContentType) {
      sanitisedResponseBody.contentMediaType = responseContentType;
    }

    const sanitisedRequestHeaders = kvToSchema([
      ...clonedRequest.headers.entries(),
    ]);

    const sanitisedResponseHeaders = kvToSchema([
      ...clonedResponse.headers.entries(),
    ]);

    const query = kvToSchema([
      ...new URL(url, "http://localhost").searchParams.entries(),
    ]);

    const operation: Operation = {
      request: {
        method: clonedRequest.method,
        uri: url,
        headers: sanitisedRequestHeaders,
        query: query,
        body: sanitisedRequestBody,
      },
      response: {
        headers: sanitisedResponseHeaders,
        body: sanitisedResponseBody,
        statusCode: clonedResponse.status,
      },
    };

    captureOperation(operation);
  });
}

function isPrimitive(value: any): value is JSONSchema7TypeName {
  const validPrimitives = ["string", "number", "integer", "boolean", "null"];
  return validPrimitives.includes(typeof value) || value === null;
}

function kvToSchema(values: [string, unknown][]): Record<string, JSONSchema7> {
  return values.reduce<Record<string, JSONSchema7>>((out, [name, value]) => {
    out[name] = mapValueToSchema(value);
    return out;
  }, {});
}

function mapValueToSchema(body: any, propName?: string): JSONSchema7 {
  if (isPrimitive(body)) {
    const identifiedType = findType(body, propName);
    const format = identifiedType?.type || getType(body);

    const payload: JSONSchema7 = {
      type: typeof body as JSONSchema7TypeName,
      format: format as string,
      ...identifiedType?.schemaProps,
    };

    return payload;
  }

  if (Array.isArray(body)) {
    const arraySchemas: JSONSchema7[] = [];
    body.forEach((item) => arraySchemas.push(mapValueToSchema(item, propName)));

    return {
      type: "array",
      items: {
        oneOf: arraySchemas,
      },
      minItems: arraySchemas.length,
      maxItems: arraySchemas.length,
    };
  }

  if (typeof body === "object" && body !== null) {
    const payload: JSONSchema7 = {
      type: "object",
      properties: {},
      required: Object.keys(body),
    };

    for (const key in body) {
      if (
        payload.properties &&
        Object.prototype.hasOwnProperty.call(body, key)
      ) {
        payload.properties[key] = mapValueToSchema(body[key], key);
      }
    }

    return payload;
  }

  throw new Error(`Unknown type ${typeof body}`);
}
