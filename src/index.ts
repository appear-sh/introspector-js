import type { AppearConfig } from "./config";

import * as hooks from "./hooks";

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

export type Report = {
  reporter: AppearReporter;
  operations: {
    request: {
      method: string; // done
      uri: string; // done
      headers: Record<string, Primitive>;
      query: Record<string, Primitive>;
      body: Payload;
    };
    response: {
      headers: Record<string, string>;
      body: Payload;
      statusCode: number;
    };
  }[];
};

const bufferedReports: Report[] = [];

export function captureReport(report: Report) {
  bufferedReports.push(report);
  console.log("got new report:", JSON.stringify(report, null, 2));
}

interface AppearIntrospector {
  stop: () => void;
}

export function init(
  config: AppearConfig,
  reporter?: AppearReporter
): AppearIntrospector {
  function sendReports() {
    // TODO: send

    console.debug("would send reports");
    bufferedReports;
  }

  const reportInterval = setInterval(() => {
    sendReports();
  }, config.reporting?.intervalSeconds ?? 5000);

  function stop() {
    clearInterval(reportInterval);
  }

  hooks.hookFetch(reporter);
  // hooks.hookXMLHttpRequest();

  return {
    stop,
  };
}
