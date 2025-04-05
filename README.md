# Appear JS introspector

**Unlock the full potential of your existing APIs @ [Appear.sh](https://www.appear.sh/)**

Appear is an API development platform that helps companies understand, improve, and manage their internal APIs.

This JS introspector is a tool that listens to both incoming and outgoing traffic in JS runtime (browser, node) and detects the shape (schema) of it and reports this schema to Appear platform where it's further merged, processed, and analyzed.

Because it reports only schema of the traffic, it never sends any actual content of the data nor PII.

## Table of Contents

- [Usage](#usage)
  - [Installation](#1-install-using-your-favorite-package-manager)
  - [Framework Integration](#2-before-your-application-starts-register-instrumentation)
    - [Express/Fastify/Koa](#thin-servers-like-express-fastify-koa--that-start-using-node-serverjs)
    - [Nest.js](#nestjs)
    - [Next.js](#nextjs)
  - [Validation in Appear.sh](#3-youre-done)
- [Configuration](#configuration)
- [FAQ](#faq)
- [Support](#support)

## Usage

### 1. Install using your favorite package manager

```sh
npm i @appear.sh/introspector
yarn add @appear.sh/introspector
pnpm add @appear.sh/introspector
```

### 2. Before your application starts, register instrumentation

Specific details on how to do this may vary based on the framework you're using.

---

#### Thin servers like Express, Fastify, Koa, ... that start using `node server.js`

_Examples: [Express](https://github.com/appear-sh/introspector-js/tree/main/apps/express), [Fastify](https://github.com/appear-sh/introspector-js/tree/main/apps/fastify)_

1. create `appear.js` file with

```ts
import { registerAppear } from "@appear.sh/introspector/node"

registerAppear({
  apiKey: process.env.APPEAR_REPORTING_KEY,
  environment: process.env.NODE_ENV,
})
```

2. Add register the hook into node by adding --import param to the start script

```sh
node --import ./appear.js server.js
```

---

#### Nest.js

_[Example](https://github.com/appear-sh/introspector-js/tree/main/apps/nestjs)_

1. add `registerAppear()` directly to your `main.ts`

```ts
// src/main.ts
import { registerAppear } from "@appear.sh/introspector/node"

registerAppear({
  apiKey: process.env.APPEAR_REPORTING_KEY,
  environment: process.env.NODE_ENV,
})
```

---

#### Next.js

_[Example](https://github.com/appear-sh/introspector-js/tree/main/apps/nextjs)_

> Unfortunately, Next.js currently has only partial support/compatibility for OpenTelemetry instrumentation, and so using their provided [instrumentation.ts](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation) file will result only with partial capture of traffic.
>
> - Pages router will capture only incoming requests
> - App router will capture only outgoing requests
>
> We're actively working on improving Next.js support. If you're interested in this integration, please contact us.

1. create instrumentation.ts as described in [Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
2. add `registerAppear()` in the `register()` hook

```ts
// instrumentation.ts
import { registerAppear } from "@appear.sh/introspector/node"

export function register() {
  registerAppear({
    apiKey: process.env.APPEAR_REPORTING_KEY,
    environment: process.env.NODE_ENV,
  })
}
```

### 3. you're done

now you can login into [app.appear.sh](https://app.appear.sh) and see what's being reported

## Configuration

```ts
export interface AppearConfig {
  /**
   * API key used for reporting
   * you can obtain your reporting key in keys section in Appear settings
   * reporting keys have only the permission to report schema and can't read any data
   * you can use any method to inject the key, in examples we used env variable
   */
  apiKey: string
  /**
   * Environment where the report is sent from
   * it can be any string that identifies environment data are reported from.
   * Often used as "production" or "staging", however if you're using some form of ephemeral farm feel free to use it's identifier
   */
  environment: string

  /**
   * Name of current service
   * used to improve accuracy of matching, useful when you're not using descriptive host names in incoming requests
   * for example if you're using directly IP addresses
   *
   * @optional
   * @default hostname if not provided the service name will be detected from hostname
   */
  serviceName?: string

  /**
   * A flag you can use to disable introspector completely
   * useful if you don't want to report in certain environments
   *
   * @default true
   */
  enabled?: boolean

  /** configuration of how often and where data are reported */
  reporting?: {
    /**
     * endpoint reports are sent to, useful if you want to audit what data are reported
     * simple audit can be done by navigating to https://public.requestbin.com/r which will give you endpoint url you can paste here and see in the debugger all traffic
     *
     * @default https://api.appear.sh/v1/reports
     */
    endpoint?: string
  }

  interception?: {
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

## FAQ

### Data Privacy and Security

<details>
<summary>**What data does the introspector collect and report?**</summary>

The introspector only collects and reports the structure (schema) of your API traffic. It does not collect or transmit:

- Actual content of requests or responses
- Personal Identifiable Information (PII)
- Sensitive business data
- Authentication tokens or credentials

For example, if your API receives a request with user data like `{ "name": "John Doe", "email": "john@example.com" }`, the introspector only reports the schema structure:

```jsonc
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 8, // min and max length are calculated based on all the instances we see
      "maxLength": 8,
    },
    "email": {
      "type": "string",
      "minLength": 16,
      "maxLength": 16,
    },
  },
  "required": ["name", "email"], // if some objects contain the fields and some not we'll automatically detect the field as optional
}
```

The actual values are never transmitted.

</details>

## Support

Need help? We're here to assist you!

- **Email**: support@appear.sh
- **Website**: [appear.sh](https://appear.sh)
- **Documentation**: [docs.appear.sh](https://docs.appear.sh)

For bug reports or feature requests, please visit our [GitHub repository](https://github.com/appear-sh/introspector-js).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
