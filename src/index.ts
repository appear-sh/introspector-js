import {
  type AppearConfig,
  APPEAR_REPORTING_ENDPOINT,
  APPEAR_SERVICE_NAME,
  APPEAR_INTROSPECTOR_VERSION,
} from "./config";
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

export function captureOperation(operation: Operation) {
  bufferedOperations.push(operation);
  console.log("got new operation:", JSON.stringify(operation, null, 2));
}

interface AppearIntrospector {
  stop: () => void;
}

export async function init(
  config: AppearConfig,
  reporter?: AppearReporter
): Promise<AppearIntrospector> {
  await hook();

  if (!reporter?.name) {
    if (!APPEAR_SERVICE_NAME) {
      throw new Error(
        "A service name for Appear must be configured. Please see documentation."
      );
    }

    reporter = {
      ...(reporter ?? {}),
      name: APPEAR_SERVICE_NAME,
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

      const response = await fetch(APPEAR_REPORTING_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
          "X-Appear-Runtime": "nodejs",
          "X-Appear-Introspector-Version":
            APPEAR_INTROSPECTOR_VERSION.toString(),
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
