import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = Number(process.env.HEALTH_PORT ?? process.env.PORT ?? 3201);
  await app.listen(port);
  new Logger('HealthMonitor').log(`Afterglow CHM listening on :${port}`);
}

void bootstrap();
