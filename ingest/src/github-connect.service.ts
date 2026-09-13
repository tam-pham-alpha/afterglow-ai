import { BadRequestException, Injectable } from '@nestjs/common';
import {
  buildGithubAppManifest,
  clearGithubConnection,
  githubAppJwt,
  githubFormUrl,
  isSmeeUrl,
  loadGithubConnection,
  patchGithubConnection,
  randomAppName,
  resolveWebhookSecret,
  saveGithubConnection,
  toPublicGithubConnection,
  type GithubConnection,
} from '@afterglow-ai/shared';
import { createHmac, randomBytes } from 'crypto';

type ManifestConversion = {
  id: number;
  slug: string;
  name?: string;
  html_url?: string;
  client_id?: string;
  client_secret?: string;
  webhook_secret?: string;
  pem?: string;
};

@Injectable()
export class GithubConnectService {
  status() {
    return toPublicGithubConnection();
  }

  async start(input: {
    ingestUrl: string;
    org?: string;
    webhookUrl?: string;
  }) {
    const ingestUrl = input.ingestUrl.replace(/\/$/, '');
    if (!/^https?:\/\//i.test(ingestUrl)) {
      throw new BadRequestException('ingestUrl must be an absolute http(s) URL');
    }
    const webhookUrl =
      input.webhookUrl?.trim() ||
      process.env.AFTERGLOW_WEBHOOK_URL?.trim() ||
      (await createSmeeChannel());
    const manifest = buildGithubAppManifest({
      name: randomAppName(),
      ingestUrl,
      webhookUrl,
    });
    // Manifest events are repo webhooks only — not installation lifecycle.
    return {
      githubFormUrl: githubFormUrl(input.org),
      manifest,
      webhookUrl,
      webhookProxy: isSmeeUrl(webhookUrl),
    };
  }

  async completeManifest(code: string): Promise<GithubConnection> {
    const res = await fetch(
      `https://api.github.com/app-manifests/${encodeURIComponent(code)}/conversions`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'afterglow-ai',
        },
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      throw new BadRequestException(
        `GitHub did not finish the app: ${res.status} ${detail}`,
      );
    }
    const created = (await res.json()) as ManifestConversion;
    if (!created.webhook_secret || !created.pem) {
      throw new BadRequestException('GitHub conversion missing secret or private key');
    }
    const now = new Date().toISOString();
    const previous = loadGithubConnection();
    return saveGithubConnection({
      appId: created.id,
      slug: created.slug,
      name: created.name ?? created.slug,
      htmlUrl: created.html_url,
      clientId: created.client_id,
      clientSecret: created.client_secret,
      webhookSecret: created.webhook_secret,
      privateKey: created.pem,
      webhookUrl: previous?.webhookUrl,
      webhookProxy: previous?.webhookProxy ?? isSmeeUrl(previous?.webhookUrl),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    });
  }

  saveManual(input: {
    webhookSecret?: string;
    webhookUrl?: string;
    appId?: number | string;
    slug?: string;
    privateKey?: string;
  }): GithubConnection {
    const webhookSecret =
      input.webhookSecret?.trim() ||
      loadGithubConnection()?.webhookSecret ||
      randomBytes(20).toString('hex');
    const webhookUrl = input.webhookUrl?.trim() || loadGithubConnection()?.webhookUrl;
    const now = new Date().toISOString();
    const previous = loadGithubConnection();
    return saveGithubConnection({
      ...previous,
      webhookSecret,
      webhookUrl,
      webhookProxy: isSmeeUrl(webhookUrl),
      appId: parseAppId(input.appId) ?? previous?.appId,
      slug: input.slug?.trim() || previous?.slug,
      privateKey: input.privateKey?.trim() || previous?.privateKey,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    });
  }

  disconnect(): { connected: false } {
    clearGithubConnection();
    return { connected: false };
  }

  async pingObserver(): Promise<{ ok: true; observer: string }> {
    const secret = resolveWebhookSecret();
    if (!secret) {
      throw new BadRequestException(
        'no webhook secret yet — connect the GitHub App or save a local secret',
      );
    }
    const observer = (
      process.env.OBSERVER_URL ?? 'http://127.0.0.1:3200'
    ).replace(/\/$/, '');
    const body = JSON.stringify({
      zen: 'Afterglow ping from ingest.',
      sender: { login: 'afterglow-ingest' },
    });
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    const res = await fetch(`${observer}/hooks/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'ping',
        'X-GitHub-Delivery': `ingest-ping-${Date.now()}`,
        'X-Hub-Signature-256': signature,
      },
      body,
    });
    if (!res.ok) {
      throw new BadRequestException(
        `observer ${res.status}: ${await res.text()}`,
      );
    }
    return { ok: true, observer };
  }

  async refreshInstall(): Promise<GithubConnection> {
    const conn = loadGithubConnection();
    if (!conn?.appId || !conn.privateKey) {
      throw new BadRequestException('connect a GitHub App first');
    }
    const jwt = githubAppJwt(conn.appId, conn.privateKey);
    const installations = await githubApi<
      Array<{
        id: number;
        account?: { login?: string };
      }>
    >('/app/installations', jwt);
    if (!installations.length) {
      const next = patchGithubConnection({
        installationId: undefined,
        installedRepos: [],
      });
      if (!next) {
        throw new BadRequestException('connection disappeared');
      }
      return next;
    }
    const installation = installations[0];
    const repos = await githubApi<{
      repositories?: Array<{ full_name?: string }>;
    }>(`/app/installations/${installation.id}/repos`, jwt);
    const installedRepos = (repos.repositories ?? [])
      .map((repo) => repo.full_name)
      .filter((name): name is string => Boolean(name));
    const next = patchGithubConnection({
      installationId: installation.id,
      installedRepos,
    });
    if (!next) {
      throw new BadRequestException('connection disappeared');
    }
    return next;
  }
}

function parseAppId(value: number | string | undefined): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function createSmeeChannel(): Promise<string> {
  const res = await fetch('https://smee.io/new', {
    method: 'HEAD',
    redirect: 'manual',
  });
  const location = res.headers.get('location');
  if (location && /^https:\/\/smee\.io\//i.test(location)) {
    return location;
  }
  const again = await fetch('https://smee.io/new', { redirect: 'follow' });
  if (again.ok && /smee\.io\//i.test(again.url)) {
    return again.url;
  }
  throw new BadRequestException(
    'could not open a smee.io channel — paste a public webhook URL (ngrok / smee) and retry',
  );
}

async function githubApi<T>(path: string, jwt: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${jwt}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'afterglow-ai',
    },
  });
  if (!res.ok) {
    throw new BadRequestException(
      `GitHub API ${path} ${res.status}: ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}
