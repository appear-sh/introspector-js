import * as path from "path";

export interface AppearConfig {
  apiKey: string;

  sampleRate?: number;

  reporting?: {
    intervalSeconds?: number;
  };
}

const DEFAULT_APPEAR_SERVER = "https://app.appear.sh";
const DEFAULT_REPORTING_URL = "/api/reports";

const APPEAR_SERVER = process.env["APPEAR_SERVER"] ?? DEFAULT_APPEAR_SERVER;
const APPEAR_REPORTING_URL =
  process.env["APPEAR_REPORTING_URL"] ?? DEFAULT_REPORTING_URL;

// TODO: Validate the above env vars.

export const APPEAR_REPORTING_ENDPOINT = `${APPEAR_SERVER}${APPEAR_REPORTING_URL}`;

export const APPEAR_SERVICE_NAME =
  process.env["APPEAR_SERVICE_NAME"] ?? getPackageName();

export const APPEAR_INTROSPECTOR_VERSION = getIntrospectorVersion();

function getPackageName(): string | null {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = require(packageJsonPath);
    return packageJson.name || null;
  } catch (error) {
    console.error(`Could not read package.json: ${error}`);
    return null;
  }
}

function getIntrospectorVersion(): number {
  try {
    const packageJsonPath = path.resolve(__dirname, "..", "package.json");
    const packageJson = require(packageJsonPath);
    return packageJson.version;
  } catch (error) {
    throw new Error(`Could not read package.json: ${error}`);
  }
}
