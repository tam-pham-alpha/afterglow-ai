export type GithubAppManifest = {
  name: string;
  url: string;
  hook_attributes: { url: string };
  redirect_url: string;
  setup_url: string;
  public: false;
  default_permissions: {
    contents: 'read';
    metadata: 'read';
    pull_requests: 'read';
    issues: 'read';
  };
  default_events: string[];
};

const DEFAULT_HOMEPAGE = 'https://github.com/tam-pham-alpha/afterglow-ai';

export function githubFormUrl(org?: string): string {
  const slug = org?.trim();
  if (slug) {
    return `https://github.com/organizations/${encodeURIComponent(slug)}/settings/apps/new`;
  }
  return 'https://github.com/settings/apps/new';
}

export function buildGithubAppManifest(input: {
  name: string;
  ingestUrl: string;
  webhookUrl: string;
  homepageUrl?: string;
}): GithubAppManifest {
  const ingestUrl = input.ingestUrl.replace(/\/$/, '');
  const homepage =
    input.homepageUrl?.trim() ||
    process.env.AFTERGLOW_APP_HOMEPAGE?.trim() ||
    DEFAULT_HOMEPAGE;
  return {
    name: input.name,
    url: homepage,
    hook_attributes: { url: input.webhookUrl },
    redirect_url: `${ingestUrl}/github/callback`,
    setup_url: `${ingestUrl}/github/setup`,
    public: false,
    default_permissions: {
      contents: 'read',
      metadata: 'read',
      pull_requests: 'read',
      issues: 'read',
    },
    // installation / installation_repositories are not valid default_events.
    // GitHub still posts them when the app is installed.
    default_events: [
      'push',
      'pull_request',
      'issues',
      'issue_comment',
      'release',
    ],
  };
}

export function randomAppName(): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `Afterglow ${suffix}`;
}
