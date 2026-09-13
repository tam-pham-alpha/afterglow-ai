export type GithubAppManifest = {
  name: string;
  url: string;
  hook_attributes: { url: string; active: boolean };
  redirect_url: string;
  callback_urls: string[];
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
}): GithubAppManifest {
  const ingestUrl = input.ingestUrl.replace(/\/$/, '');
  return {
    name: input.name,
    url: ingestUrl,
    hook_attributes: { url: input.webhookUrl, active: true },
    redirect_url: `${ingestUrl}/github/callback`,
    callback_urls: [`${ingestUrl}/github/callback`],
    setup_url: `${ingestUrl}/#github`,
    public: false,
    default_permissions: {
      contents: 'read',
      metadata: 'read',
      pull_requests: 'read',
      issues: 'read',
    },
    default_events: [
      'installation',
      'installation_repositories',
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
