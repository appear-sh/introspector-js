import { gatherConfig, type AppearConfig } from "./config";
import {
  SomeSchemaType,
  StringSchemaType,
} from "./contentTypes/jsonSchema.types";
import { hook } from "./hooks";

export type Operation = {
  request: {
    origin?: string;
    method: string;
    uri: string;
    headers: Record<string, StringSchemaType>;
    query: Record<string, SomeSchemaType>;
    body: null | {
      type?: "string";
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentschema
      contentSchema?: SomeSchemaType;
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentmediatype
      contentMediaType: string;
    };
  };
  response: {
    statusCode: number;
    headers: Record<string, StringSchemaType>;
    body: null | {
      type?: "string";
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentschema
      contentSchema?: SomeSchemaType;
      // https://json-schema.org/draft/2020-12/json-schema-validation#name-contentmediatype
      contentMediaType: string;
    };
  };
};

export type Report = {
  reporter: {
    // meta info about the reporter
    environment: string;
  };
  operations: Operation[];
};

let bufferedOperations: Operation[] = [];

interface AppearIntrospector {
  stop: () => void;
}

export async function init(config: AppearConfig): Promise<AppearIntrospector> {
  // Short-circuit everything, do nothing.
  if (config.enabled === false) return { stop: () => {} };

  const internalConfig = gatherConfig();

  async function captureOperation(operation: Operation) {
    bufferedOperations.push(operation);
    if (config.sendImmediately) {
      await sendReports();
    }
  }

  await hook(config, internalConfig, captureOperation);

  let currentTimeout: NodeJS.Timeout | null = null;

  function queueSend() {
    currentTimeout = setTimeout(
      sendReports,
      config.reporting?.intervalSeconds ?? 5000
    );
  }

  async function sendReports() {
    // Create a copy of the current operations
    const operationsToSend = [...bufferedOperations];

    if (operationsToSend.length === 0) {
      return;
    }

    try {
      const report: Report = {
        reporter: { environment: config.environment },
        operations: operationsToSend,
      };

      const response = await fetch(internalConfig.reportingEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
          "X-Appear-Runtime": "nodejs",
          "X-Appear-Introspector-Version": internalConfig.introspectorVersion,
        },
        body: JSON.stringify(report),
      });

      if (response.ok) {
        // Remove the sent operations from bufferedOperations
        bufferedOperations = bufferedOperations.filter(
          (operation) => !operationsToSend.includes(operation)
        );

        console.log(
          "[introspector] appear /reports response:",
          await response.json()
        );
      } else {
        // Handle non-successful responses
        console.error("Failed to send reports:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending reports:", error);
    }

    if (!config.sendImmediately) {
      queueSend();
    }
  }

  // Trigger first queueing
  if (!config.sendImmediately) {
    queueSend();
  }

  async function stop() {
    // Send any reports we've got
    await sendReports();

    if (currentTimeout) {
      clearTimeout(currentTimeout);
      currentTimeout = null;
    }
  }

  return {
    stop,
  };
}
