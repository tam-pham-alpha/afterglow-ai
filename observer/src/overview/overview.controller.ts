import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { GithubWebhookService } from '../github/github-webhook.service';

@Controller()
export class OverviewController {
  constructor(private readonly webhooks: GithubWebhookService) {}

  @Get('overview')
  overview() {
    return this.webhooks.overview();
  }

  @Get('events')
  events() {
    return this.webhooks.events();
  }

  @Get('events/:id')
  event(@Param('id') id: string) {
    const row = this.webhooks.event(id);
    if (!row) {
      throw new NotFoundException(`event ${id} not found`);
    }
    return row;
  }

  @Get('health')
  health() {
    return { ok: true, service: 'observer' };
  }
}
