import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { registerAppear } from "@appear.sh/introspector/node"

registerAppear({
  apiKey: "test-key",
  environment: "test",
  serviceName: "nestjs-test",
  reporting: { endpoint: process.env.COLLECTOR_URL },
})

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const server = await app.listen(0)
  const port = server.address().port
  console.log(`Server started on port ${port}`)
}
bootstrap()
