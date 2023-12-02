import { type AppearConfig, gatherConfig } from "./config";
import { hook } from "./hooks";

export type Primitive =
  | "never"
  | "string"
  | "number"
  | "boolean"
  | "undefined"
  | "null"; // todo detect also types like iso8601, uuid, etc

export type Payload = Primitive | Payload[] | { [name: string]: Payload };

export type AppearReporter = {
  [key: string]: string;
};

export type Operation = {
  request: {
    method: string;
    uri: string;
    headers: Record<string, string>;
    query: Record<string, Primitive>;
    body: Payload;
  };
  response: {
    headers: Record<string, string>;
    body: Payload;
    statusCode: number;
  };
};

export type Report = {
  reporter: AppearReporter;
  operations: Operation[];
};

let bufferedOperations: Operation[] = [];

interface AppearIntrospector {
  stop: () => void;
}

export async function init(
  config: AppearConfig,
  reporter?: AppearReporter
): Promise<AppearIntrospector> {
  const internalConfig = gatherConfig();

  async function captureOperation(operation: Operation) {
    bufferedOperations.push(operation);
    if (config.sendImmediately) {
      await sendReports();
    }
  }

  await hook(internalConfig, captureOperation);

  if (!reporter?.name) {
    if (!internalConfig.serviceName) {
      throw new Error(
        "A service name for Appear must be configured. Please see documentation."
      );
    }

    reporter = {
      ...(reporter ?? {}),
      name: internalConfig.serviceName,
    };
  }

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
        reporter: reporter ?? {},
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
