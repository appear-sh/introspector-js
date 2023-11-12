import http from "node:http";
import https from "node:https";

declare module "undici-types/fetch" {
  export type Request = never;
  export type RequestInfo = never;
}

declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch;
      XMLHttpRequest: typeof XMLHttpRequest;
      http: typeof http;
      https: typeof https;
    }
  }
}
