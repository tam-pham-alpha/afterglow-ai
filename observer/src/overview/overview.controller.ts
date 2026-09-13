import { Controller, Get } from '@nestjs/common';
import { GithubWebhookService } from '../github/github-webhook.service';

@Controller()
export class OverviewController {
  constructor(private readonly webhooks: GithubWebhookService) {}

  @Get('overview')
  overview() {
    return this.webhooks.overview();
  }

  @Get('summary')
  summary() {
    return this.webhooks.summary();
  }

  @Get('health')
  health() {
    return { ok: true, service: 'observer' };
  }
}
