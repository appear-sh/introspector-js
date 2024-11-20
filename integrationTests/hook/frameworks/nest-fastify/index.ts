import type { FrameworkTest, FrameworkStartedInfo } from "../../hook.test"
import { NestFactory } from "@nestjs/core"
import {
  NestFastifyApplication,
  FastifyAdapter,
} from "@nestjs/platform-fastify"

import { AppModule } from "./app.module"

async function init(): Promise<FrameworkStartedInfo> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: ["error"],
    },
  )

  const port = await new Promise<number>((resolve) => {
    const server = require("net").createServer()
    server.listen(0, () => {
      const port = (server.address() as any).port
      server.close(() => resolve(port))
    })
  })

  await app.listen(port)

  return {
    port,
    stop: async () => {
      await app.close()
      return null
    },
  }
}

export const nestFastifyTest: FrameworkTest = {
  framework: "nest-fastify",
  init,
}
