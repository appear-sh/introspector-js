import { BatchInterceptor, Interceptor } from "@mswjs/interceptors";
import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import * as jsEnv from "browser-or-node";
import { type Operation } from "./";
import { AppearConfig, InternalConfig } from "./config";
import { schemaFromValue } from "./contentTypes/contentTypes";
import { isNonNullable } from "./helpers";

const getBodySchema = async (input: Request | Response) => {
  const clone = input.clone();
  if (!clone.body) return null;

  const contentMediaType = clone.headers
    .get("content-type")
    ?.toLowerCase()
    ?.split(";")[0]
    ?.trim();

  if (/application\/(?:.*\+)?json/.test(contentMediaType ?? "")) {
    // application/json;
    // application/something+json;
    // application/vnd.something-other+json;
    const contentSchema = schemaFromValue(await clone.json(), "in:body");
    if (!contentSchema) return null;
    return {
      type: "string" as const,
      contentSchema,
      contentMediaType: contentMediaType!,
    };
  } else if (/application\/(?:.*\+)?xml/.test(contentMediaType ?? "")) {
    // application/xml;
    // application/something+xml;
    // application/vnd.something-other+xml;
    // todo add xml parsing
    return { type: "string" as const, contentMediaType: contentMediaType! };
  } else if (contentMediaType?.includes("text/")) {
    return { type: "string" as const, contentMediaType: contentMediaType! };
  }
  // todo add other types

  // unknown type
  return null;
};

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

    const requestBody = await getBodySchema(clonedRequest);
    const responseBody = await getBodySchema(clonedResponse);

    const requestHeadersSchemaEntries = [...clonedRequest.headers.entries()]
      .map(([name, value]) => {
        const schema = schemaFromValue(value, "in:headers");
        return schema ? [name, schema] : undefined;
      })
      .filter(isNonNullable);

    const responseHeadersSchemaEntries = [...clonedResponse.headers.entries()]
      .map(([name, value]) => {
        const schema = schemaFromValue(value, "in:headers");
        return schema ? [name, schema] : undefined;
      })
      .filter(isNonNullable);

    const query = [...new URL(url, "http://localhost").searchParams.entries()]
      .map(([name, value]) => {
        const schema = schemaFromValue(value, "in:query");
        return schema ? [name, schema] : undefined;
      })
      .filter(isNonNullable);

    const operation: Operation = {
      request: {
        method: clonedRequest.method,
        uri: url,
        headers: Object.fromEntries(requestHeadersSchemaEntries),
        query: Object.fromEntries(query),
        body: requestBody,
      },
      response: {
        headers: Object.fromEntries(responseHeadersSchemaEntries),
        statusCode: clonedResponse.status,
        body: responseBody,
      },
    };

    captureOperation(operation);
  });
}
