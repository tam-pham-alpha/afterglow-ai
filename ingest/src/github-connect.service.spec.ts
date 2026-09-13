import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  applyInstallationPayload,
  clearGithubConnection,
  githubAppJwt,
  loadGithubConnection,
  saveGithubConnection,
  toPublicGithubConnection,
} from '@afterglow-ai/shared';
import { generateKeyPairSync } from 'crypto';
import { GithubConnectService } from './github-connect.service';

describe('GithubConnectService', () => {
  const dir = mkdtempSync(join(tmpdir(), 'afterglow-github-'));
  const previousDir = process.env.AFTERGLOW_DATA_DIR;
  const previousSecret = process.env.GITHUB_WEBHOOK_SECRET;
  let fetchMock: jest.Mock;

  beforeAll(() => {
    process.env.AFTERGLOW_DATA_DIR = dir;
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
    clearGithubConnection();
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

  it('does not put secrets on the public status', () => {
    saveGithubConnection({
      webhookSecret: 'super-secret',
      privateKey: '-----BEGIN RSA PRIVATE KEY-----',
      appId: 1,
      slug: 'afterglow-x',
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
    });
    const pub = toPublicGithubConnection();
    expect(pub.connected).toBe(true);
    expect(pub.installUrl).toContain('afterglow-x');
    expect(JSON.stringify(pub)).not.toContain('super-secret');
    expect(JSON.stringify(pub)).not.toContain('BEGIN RSA');
  });

  it('starts a manifest with a smee webhook and keeps it on disk', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'https://smee.io/try-me' },
      url: 'https://smee.io/try-me',
    });
    const github = new GithubConnectService();
    const started = await github.start({
      ingestUrl: 'http://127.0.0.1:3202',
    });
    expect(started.githubFormUrl).toBe('https://github.com/settings/apps/new');
    expect(started.manifest.hook_attributes.url).toBe('https://smee.io/try-me');
    expect(started.manifest.redirect_url).toBe(
      'http://127.0.0.1:3202/github/callback',
    );
    github.saveManual({ webhookUrl: started.webhookUrl });
    expect(loadGithubConnection()?.webhookUrl).toBe('https://smee.io/try-me');
    expect(loadGithubConnection()?.webhookSecret).toBeTruthy();
  });

  it('stores the app credentials after the manifest conversion', async () => {
    saveGithubConnection({
      webhookSecret: 'temp',
      webhookUrl: 'https://smee.io/try-me',
      webhookProxy: true,
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        slug: 'afterglow-try',
        name: 'Afterglow try',
        html_url: 'https://github.com/apps/afterglow-try',
        webhook_secret: 'from-github',
        pem: '-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----',
      }),
    });
    const github = new GithubConnectService();
    const saved = await github.completeManifest('one-time-code');
    expect(saved.appId).toBe(42);
    expect(saved.webhookSecret).toBe('from-github');
    expect(saved.webhookUrl).toBe('https://smee.io/try-me');
    expect(JSON.parse(readFileSync(join(dir, 'github.json'), 'utf8')).pem).toBeUndefined();
    expect(loadGithubConnection()?.privateKey).toContain('BEGIN RSA');
  });

  it('signs a ping for observer with the stored secret', async () => {
    saveGithubConnection({
      webhookSecret: 'ping-secret',
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
    });
    fetchMock.mockResolvedValue({ ok: true, text: async () => '' });
    const github = new GithubConnectService();
    await github.pingObserver();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Hub-Signature-256']).toMatch(/^sha256=/);
    expect(init.body).toContain('Afterglow ping');
  });

  it('records installation repos onto the connection file', () => {
    saveGithubConnection({
      webhookSecret: 'x',
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
    });
    applyInstallationPayload({
      action: 'created',
      installation: { id: 7 },
      repositories: [{ full_name: 'tam-pham-alpha/afterglow-ai' }],
    });
    expect(loadGithubConnection()?.installationId).toBe(7);
    expect(loadGithubConnection()?.installedRepos).toEqual([
      'tam-pham-alpha/afterglow-ai',
    ]);
  });

  it('mints a three-part GitHub App JWT', () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const token = githubAppJwt(99, pem);
    expect(token.split('.')).toHaveLength(3);
  });
});
