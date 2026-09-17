import { Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { GithubWebhookService } from './github-webhook.service';
import { SMEE_PROXY_HEADER } from './smee-proxy';

@Controller('hooks')
export class GithubWebhookController {
  constructor(private readonly webhooks: GithubWebhookService) {}

  @Post('github')
  receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-github-event') event = 'unknown',
    @Headers('x-github-delivery') deliveryId = `local-${Date.now()}`,
    @Headers('x-hub-signature-256') signature?: string,
    @Headers(SMEE_PROXY_HEADER) smeeProxy?: string,
  ) {
    return this.webhooks.ingest({
      event,
      deliveryId,
      signature,
      rawBody: req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {})),
      payload: req.body,
      viaSmeeProxy: smeeProxy === '1' && isLoopback(req),
    });
  }
}

function isLoopback(req: Request): boolean {
  const ip = req.socket.remoteAddress ?? req.ip ?? '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}
