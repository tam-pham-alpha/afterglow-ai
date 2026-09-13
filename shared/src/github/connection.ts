import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterglowDataDir } from '../paths';

export type GithubConnection = {
  appId?: number;
  slug?: string;
  name?: string;
  htmlUrl?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret: string;
  privateKey?: string;
  webhookUrl?: string;
  webhookProxy?: boolean;
  installationId?: number;
  installedRepos?: string[];
  createdAt: string;
  updatedAt: string;
};

export type GithubConnectionPublic = {
  connected: boolean;
  hasWebhookSecret: boolean;
  hasPrivateKey: boolean;
  hasApp: boolean;
  usingEnvSecret: boolean;
  appId?: number;
  slug?: string;
  name?: string;
  htmlUrl?: string;
  installUrl?: string;
  webhookUrl?: string;
  webhookProxy?: boolean;
  installationId?: number;
  installedRepos?: string[];
};

export function githubConnectionPath(): string {
  return join(afterglowDataDir(), 'github.json');
}

export function loadGithubConnection(): GithubConnection | null {
  const filePath = githubConnectionPath();
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<GithubConnection>;
    if (!parsed.webhookSecret?.trim()) {
      return null;
    }
    return parsed as GithubConnection;
  } catch {
    return null;
  }
}

export function saveGithubConnection(next: GithubConnection): GithubConnection {
  const filePath = githubConnectionPath();
  mkdirSync(afterglowDataDir(), { recursive: true });
  writeFileSync(filePath, JSON.stringify(next, null, 2));
  return next;
}

export function patchGithubConnection(
  patch: Partial<GithubConnection>,
): GithubConnection | null {
  const current = loadGithubConnection();
  if (!current) {
    return null;
  }
  return saveGithubConnection({
    ...current,
    ...patch,
    webhookSecret: patch.webhookSecret ?? current.webhookSecret,
    updatedAt: new Date().toISOString(),
  });
}

export function clearGithubConnection(): void {
  try {
    unlinkSync(githubConnectionPath());
  } catch {
    // already gone
  }
}

export function resolveWebhookSecret(conn = loadGithubConnection()): string {
  const fromEnv = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return conn?.webhookSecret?.trim() ?? '';
}

export function toPublicGithubConnection(
  conn = loadGithubConnection(),
): GithubConnectionPublic {
  const envSecret = Boolean(process.env.GITHUB_WEBHOOK_SECRET?.trim());
  if (!conn && !envSecret) {
    return {
      connected: false,
      hasWebhookSecret: false,
      hasPrivateKey: false,
      hasApp: false,
      usingEnvSecret: false,
    };
  }
  return {
    connected: Boolean(conn?.webhookSecret || envSecret),
    hasWebhookSecret: Boolean(conn?.webhookSecret || envSecret),
    hasPrivateKey: Boolean(conn?.privateKey),
    hasApp: Boolean(conn?.appId && conn?.slug),
    usingEnvSecret: envSecret,
    appId: conn?.appId,
    slug: conn?.slug,
    name: conn?.name,
    htmlUrl: conn?.htmlUrl,
    installUrl: conn?.slug
      ? `https://github.com/apps/${conn.slug}/installations/new`
      : undefined,
    webhookUrl: conn?.webhookUrl,
    webhookProxy: conn?.webhookProxy,
    installationId: conn?.installationId,
    installedRepos: conn?.installedRepos,
  };
}

export function isSmeeUrl(url: string | undefined): boolean {
  return Boolean(url && /smee\.io/i.test(url));
}

export function applyInstallationPayload(payload: {
  action?: string;
  installation?: { id?: number };
  repositories?: Array<{ full_name?: string }>;
  repositories_added?: Array<{ full_name?: string }>;
  repositories_removed?: Array<{ full_name?: string }>;
}): GithubConnection | null {
  const current = loadGithubConnection();
  if (!current) {
    return null;
  }
  if (payload.action === 'deleted' || payload.action === 'suspend') {
    return patchGithubConnection({
      installationId: undefined,
      installedRepos: [],
    });
  }
  const added = [
    ...(payload.repositories ?? []),
    ...(payload.repositories_added ?? []),
  ]
    .map((repo) => repo.full_name)
    .filter((name): name is string => Boolean(name));
  const removed = new Set(
    (payload.repositories_removed ?? [])
      .map((repo) => repo.full_name)
      .filter((name): name is string => Boolean(name)),
  );
  const previous = current.installedRepos ?? [];
  const nextRepos = [
    ...new Set([...previous, ...added].filter((name) => !removed.has(name))),
  ];
  return patchGithubConnection({
    installationId: payload.installation?.id ?? current.installationId,
    installedRepos: nextRepos,
  });
}
