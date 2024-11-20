import { Controller, Get, Post, Body, HttpCode } from "@nestjs/common"
import { AppService } from "./app.service"

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get("nest-express-ping")
  @HttpCode(200)
  getNestExpressPing(): string {
    return "nest-express-pong"
  }

  @Post("nest-express-echo-request")
  @HttpCode(200)
  postNestExpressEchoRequest(@Body() body: any): any {
    return body
  }

  @Post("nest-express-echo-response")
  @HttpCode(200)
  postNestExpressEchoResponse(@Body() body: any): any {
    return body
  }
}
