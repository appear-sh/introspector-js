import * as path from "path";

import { INTROSPECTOR_VERSION } from "./version";

export interface AppearConfig {
  apiKey: string;

  enabled?: boolean;
  sendImmediately?: boolean;
  disableXHRHook?: boolean;
  sampleRate?: number;

  reporting?: {
    intervalSeconds?: number;
  };
}

export interface InternalConfig {
  reportingEndpoint: string;
  serviceName: string | null;
  introspectorVersion: string;
}

function getPackageName(): string | null {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = require(packageJsonPath);
    return packageJson.name || null;
  } catch (error) {
    return null;
  }
}

const DEFAULT_APPEAR_SERVER = "https://app.appear.sh";
const DEFAULT_REPORTING_URL = "/api/reports";

export const gatherConfig = (): InternalConfig => {
  const APPEAR_SERVER = process.env["APPEAR_SERVER"] ?? DEFAULT_APPEAR_SERVER;
  const APPEAR_REPORTING_URL =
    process.env["APPEAR_REPORTING_URL"] ?? DEFAULT_REPORTING_URL;

  // TODO: Validate the above env vars.

  const reportingEndpoint = `${APPEAR_SERVER}${APPEAR_REPORTING_URL}`;

  const serviceName = process.env["APPEAR_SERVICE_NAME"] ?? getPackageName();

  return {
    reportingEndpoint,
    serviceName,
    introspectorVersion: INTROSPECTOR_VERSION,
  };
};
