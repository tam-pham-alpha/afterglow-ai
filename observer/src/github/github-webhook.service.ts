import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import {
  applyInstallationPayload,
  isSmeeUrl,
  loadGithubConnection,
  openDefaultStore,
  resolveWebhookSecret,
  type MemoryStore,
  type OverviewSnapshot,
} from '@afterglow-ai/shared';
import { applyGithubEvent } from './apply-event';
import { startSmeeProxy } from './smee-proxy';
import { verifyGithubSignature } from './verify-signature';

@Injectable()
export class GithubWebhookService implements OnModuleInit, OnModuleDestroy {
  private readonly store: MemoryStore;
  private readonly logger = new Logger(GithubWebhookService.name);
  private proxy: { close: () => void } | null = null;
  private proxySource: string | null = null;
  private timer?: NodeJS.Timeout;

  constructor() {
    this.store = openDefaultStore();
  }

  onModuleInit() {
    this.syncProxy();
    this.timer = setInterval(() => this.syncProxy(), 2000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.proxy?.close();
  }

  ingest(params: {
    event: string;
    deliveryId: string;
    signature?: string;
    rawBody: Buffer;
    payload: unknown;
    viaSmeeProxy?: boolean;
  }): { accepted: true; deliveryId: string } {
    const secret = resolveWebhookSecret();
    if (secret) {
      const ok = verifyGithubSignature(
        params.rawBody,
        params.signature,
        secret,
      );
      if (!ok && params.viaSmeeProxy) {
        // smee delivers a parsed object; re-stringifying it breaks GitHub's HMAC.
        this.logger.warn(
          `smee body was re-serialized; accepting ${params.event} ${params.deliveryId} without a signature match`,
        );
      } else if (!ok) {
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

    if (
      params.event === 'installation' ||
      params.event === 'installation_repositories'
    ) {
      applyInstallationPayload(
        (params.payload ?? {}) as Parameters<typeof applyInstallationPayload>[0],
      );
    }

    return { accepted: true, deliveryId: params.deliveryId };
  }

  overview(): OverviewSnapshot {
    return this.store.overview();
  }

  private syncProxy() {
    const conn = loadGithubConnection();
    const source = conn?.webhookProxy && isSmeeUrl(conn.webhookUrl)
      ? conn.webhookUrl
      : undefined;
    if (source === this.proxySource) {
      return;
    }
    this.proxy?.close();
    this.proxy = null;
    this.proxySource = source ?? null;
    if (!source) {
      return;
    }
    const target = `${(
      process.env.OBSERVER_URL ?? 'http://127.0.0.1:3200'
    ).replace(/\/$/, '')}/hooks/github`;
    this.proxy = startSmeeProxy(source, target, this.logger);
  }
}
