import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubWebhookController } from './github/github-webhook.controller';
import { GithubWebhookService } from './github/github-webhook.service';
import { OverviewController } from './overview/overview.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
  ],
  controllers: [GithubWebhookController, OverviewController],
  providers: [GithubWebhookService],
})
export class AppModule {}
