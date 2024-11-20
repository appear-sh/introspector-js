import { Controller, Get, Post, Body, HttpCode } from "@nestjs/common"
import { AppService } from "./app.service"

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get("nest-fastify-ping")
  @HttpCode(200)
  getNestFastifyPing(): string {
    return "nest-fastify-pong"
  }

  @Post("nest-fastify-echo-request")
  @HttpCode(200)
  postNestFastifyEchoRequest(@Body() body: any): any {
    return body
  }

  @Post("nest-fastify-echo-response")
  @HttpCode(200)
  postNestFastifyEchoResponse(@Body() body: any): any {
    return body
  }
}
