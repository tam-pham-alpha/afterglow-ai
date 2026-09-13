import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableShutdownHooks();
  const port = Number(process.env.OBSERVER_PORT ?? process.env.PORT ?? 3200);
  await app.listen(port);
  new Logger('Observer').log(`Afterglow observer listening on :${port}`);
}

void bootstrap();
