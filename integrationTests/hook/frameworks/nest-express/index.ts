import type { FrameworkTest, FrameworkStartedInfo } from "../../hook.test"
import { NestFactory } from "@nestjs/core"

import { AppModule } from "./app.module"

async function init(): Promise<FrameworkStartedInfo> {
  const app = await NestFactory.create(AppModule, {
    logger: ["error"],
  })

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

export const nestExpressTest: FrameworkTest = {
  framework: "nest-express",
  init,
}
