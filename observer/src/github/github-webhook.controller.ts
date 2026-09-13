import { Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { GithubWebhookService } from './github-webhook.service';

@Controller('hooks')
export class GithubWebhookController {
  constructor(private readonly webhooks: GithubWebhookService) {}

  @Post('github')
  receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-github-event') event = 'unknown',
    @Headers('x-github-delivery') deliveryId = `local-${Date.now()}`,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    return this.webhooks.ingest({
      event,
      deliveryId,
      signature,
      rawBody: req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {})),
      payload: req.body,
    });
  }
}
