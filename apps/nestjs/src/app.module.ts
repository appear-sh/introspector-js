import { Module } from "@nestjs/common"
import { TestController } from "./test.controller"

@Module({
  imports: [],
  controllers: [TestController],
  providers: [],
})
export class AppModule {}
