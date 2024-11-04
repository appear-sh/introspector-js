import type { FrameworkTest, FrameworkStartedInfo } from "../hook.test"
import { NestFactory } from "@nestjs/core"
import { Body, Controller, Get, Module, Post } from "@nestjs/common"

@Controller()
class EchoController {
  @Get("nestjs-ping")
  ping(): string {
    return "nestjs-pong"
  }

  @Post("nestjs-echo-request")
  echoRequest(@Body() body: any) {
    return body
  }

  @Post("nestjs-echo-response")
  echoResponse(@Body() body: any) {
    return body
  }
}

@Module({
  controllers: [EchoController],
})
class AppModule {}

async function init(): Promise<FrameworkStartedInfo> {
  const app = await NestFactory.create(AppModule, {
    logger: ["error"], // Minimal logging
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

export const nestTest: FrameworkTest = {
  framework: "nest",
  init,
}
