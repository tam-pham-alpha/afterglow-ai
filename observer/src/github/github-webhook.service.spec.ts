import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { saveGithubConnection } from '@afterglow-ai/shared';
import { GithubWebhookService } from './github-webhook.service';

describe('GithubWebhookService — shared connection secret', () => {
  const dir = mkdtempSync(join(tmpdir(), 'afterglow-hook-'));
  const previousDir = process.env.AFTERGLOW_DATA_DIR;
  const previousSecret = process.env.GITHUB_WEBHOOK_SECRET;

  beforeAll(() => {
    process.env.AFTERGLOW_DATA_DIR = dir;
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });

  afterAll(() => {
    if (previousDir === undefined) {
      delete process.env.AFTERGLOW_DATA_DIR;
    } else {
      process.env.AFTERGLOW_DATA_DIR = previousDir;
    }
    if (previousSecret === undefined) {
      delete process.env.GITHUB_WEBHOOK_SECRET;
    } else {
      process.env.GITHUB_WEBHOOK_SECRET = previousSecret;
    }
    rmSync(dir, { recursive: true, force: true });
  });

  it('verifies with the secret from github.json, not env', () => {
    saveGithubConnection({
      webhookSecret: 'file-secret',
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
    });
    const service = new GithubWebhookService();
    const rawBody = Buffer.from('{"zen":"ok"}');
    const signature = `sha256=${createHmac('sha256', 'file-secret').update(rawBody).digest('hex')}`;
    expect(
      service.ingest({
        event: 'ping',
        deliveryId: 'd-ok',
        signature,
        rawBody,
        payload: { zen: 'ok', sender: { login: 'afterglow-ingest' } },
      }),
    ).toEqual({ accepted: true, deliveryId: 'd-ok' });

    expect(() =>
      service.ingest({
        event: 'ping',
        deliveryId: 'd-bad',
        signature: 'sha256=deadbeef',
        rawBody,
        payload: { zen: 'ok' },
      }),
    ).toThrow(UnauthorizedException);
  });

  it('accepts a smee-forwarded event when re-serialization breaks the HMAC', () => {
    saveGithubConnection({
      webhookSecret: 'file-secret',
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
    });
    const service = new GithubWebhookService();
    expect(
      service.ingest({
        event: 'push',
        deliveryId: 'd-smee',
        signature: 'sha256=deadbeef',
        rawBody: Buffer.from('{"ref":"refs/heads/main"}'),
        payload: { ref: 'refs/heads/main', sender: { login: 'tam-pham-alpha' } },
        viaSmeeProxy: true,
      }),
    ).toEqual({ accepted: true, deliveryId: 'd-smee' });
  });
});
