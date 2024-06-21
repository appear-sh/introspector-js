# Appear JS introspector

**Unlock the full potential of your existing APIs.**
[appear.io](https://www.appear.sh/)

Appear is a API development platform that helps companies understand, improve and manage their internal APIs.

This JS introspector is a tool that listens to both incoming and outgoing traffic in JS runtime (browser, node) and detects the shape (schema) of it and reports this schema to Appear platform where it's further merged, processed and analyzed.

Because it reports only schema of the traffic it never sends any actual content of the data nor PII.

## Usage

1. Install using your favourite package manager
   ```sh
   npm i @appear.sh/introspector
   yarn add @appear.sh/introspector
   pnpm add @appear.sh/introspector
   ```
2. In entrypoint of your service initialise the introspector
   ```ts
   Appear.init({
     // you can obtain your reporting key in keys section in Appear settings
     // reporting keys have only the permission to report schema and can't read any data, so are safe to be sent to browser.
     apiKey: "your-api-key",
     // environment can be any string that identifies environment data are reported from.
     // Often used as "production" or "staging", however if you're using some form of ephemeral farm feel free to use it's identifier
     environment: process.env.NODE_ENV,
   })
   ```
3. you're done, now you can login into [app.appear.sh](https://app.appear.sh) and see what's being reported

### Configuration

```ts
export interface AppearConfig {
  /** API key used for reporting */
  apiKey: string
  /** environment where the report is sent from */
  environment: string
  /**
   * flag you can use to disable introspector completely
   * useful if you don't want to report in certain environments
   *
   * @default true
   */
  enabled?: boolean

  /** configuration of how often and where are data reported */
  reporting?: {
    /**
     * endpoint reports are sent to, useful if you want to audit what data are reported
     * simple audit can be done by navigating to https://public.requestbin.com/r which will give you endpoint url you can paste here and see in the debugger all traffic
     *
     * @default https://api.appear.sh/v1/reports
     */
    endpoint?: string
    /**
     * interval how often are batches sent
     * `0` means that reports are sent immidiately
     *
     * @default 5
     */
    batchIntervalSeconds?: number
    /** number of items in batch before it reports them
     * report can be triggered be either time or size depending on what happens first
     *
     * every schema is reported only once
     *
     * `0` means batching is disabled and reports are sent immidiately
     *
     * @default 10
     */
    batchSize?: number
  }

  interception?: {
    /**
     * disables XHR introspection hook which may introduce noise in some situations
     *
     * @default false
     */
    disableXHR?: boolean
    /**
     * Optional function that allows to filter what request/response pair is getting analyzed and reported
     *
     * @default (req, req, config) => req.destination === "" && request.url !== config.reporting.endpoint
     */
    filter?: (
      request: Request,
      response: Response,
      config: ResolvedAppearConfig,
    ) => boolean
  }
}
```
