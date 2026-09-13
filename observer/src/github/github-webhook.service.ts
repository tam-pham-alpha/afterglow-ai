import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  openDefaultStore,
  type MemoryStore,
  type OverviewSnapshot,
} from '@afterglow-ai/shared';
import { applyGithubEvent } from './apply-event';
import { verifyGithubSignature } from './verify-signature';

@Injectable()
export class GithubWebhookService {
  private readonly store: MemoryStore;
  private readonly secret: string;

  constructor() {
    this.store = openDefaultStore();
    this.secret = process.env.GITHUB_WEBHOOK_SECRET ?? '';
  }

  ingest(params: {
    event: string;
    deliveryId: string;
    signature?: string;
    rawBody: Buffer;
    payload: unknown;
  }): { accepted: true; deliveryId: string } {
    if (this.secret) {
      const ok = verifyGithubSignature(
        params.rawBody,
        params.signature,
        this.secret,
      );
      if (!ok) {
        throw new UnauthorizedException('invalid GitHub signature');
      }
    }

    applyGithubEvent(this.store, {
      deliveryId: params.deliveryId,
      event: params.event,
      payload: (params.payload ?? {}) as Parameters<
        typeof applyGithubEvent
      >[1]['payload'],
    });

    return { accepted: true, deliveryId: params.deliveryId };
  }

  overview(): OverviewSnapshot {
    return this.store.overview();
  }
}
