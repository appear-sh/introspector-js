import { Controller, Post, Body, Res, HttpStatus } from "@nestjs/common"
import { makeOutgoingCalls } from "@appear.sh/test-utils"

@Controller("api")
export class TestController {
  @Post("test")
  async test(@Body() body: any, @Res() res: any) {
    await makeOutgoingCalls("nestjs")
    return res.status(HttpStatus.OK).json({ message: "Success", body })
  }
}
