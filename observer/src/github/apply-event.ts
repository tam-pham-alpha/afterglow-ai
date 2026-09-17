import { MemoryStore, type RelationshipKind } from '@afterglow-ai/shared';

type GithubUser = { login?: string; name?: string };
type GithubRepo = { full_name?: string; name?: string };
type GithubPayload = {
  action?: string;
  ref?: string;
  sender?: GithubUser;
  repository?: GithubRepo;
  pull_request?: { user?: GithubUser; merged?: boolean; title?: string };
  issue?: { user?: GithubUser; title?: string };
  release?: { author?: GithubUser; tag_name?: string; name?: string };
  workflow_run?: {
    name?: string;
    display_title?: string;
    status?: string;
    conclusion?: string | null;
    head_branch?: string;
    repository?: GithubRepo;
  };
  workflow_job?: {
    name?: string;
    workflow_name?: string;
    status?: string;
    conclusion?: string | null;
  };
  head_commit?: { message?: string };
  commits?: Array<{ message?: string }>;
  zen?: string;
};

export type ApplyGithubEventInput = {
  deliveryId: string;
  event: string;
  payload: GithubPayload;
  receivedAt?: string;
};

function collectPeople(payload: GithubPayload): GithubUser[] {
  return [
    payload.sender,
    payload.pull_request?.user,
    payload.issue?.user,
    payload.release?.author,
  ].filter((user): user is GithubUser => Boolean(user?.login));
}

function repoFrom(payload: GithubPayload): GithubRepo | undefined {
  const repo = payload.repository ?? payload.workflow_run?.repository;
  if (!repo?.full_name && !repo?.name) {
    return undefined;
  }
  return repo;
}

function firstLine(value: string | undefined): string | undefined {
  const line = value?.split('\n')[0]?.trim();
  return line || undefined;
}

function hookTitle(event: string, payload: GithubPayload): string | undefined {
  if (event === 'push') {
    return (
      firstLine(payload.head_commit?.message) ??
      firstLine(payload.commits?.[0]?.message)
    );
  }
  if (event === 'workflow_run') {
    return payload.workflow_run?.display_title ?? payload.workflow_run?.name;
  }
  if (event === 'workflow_job') {
    return payload.workflow_job?.name ?? payload.workflow_job?.workflow_name;
  }
  if (event === 'pull_request') {
    return payload.pull_request?.title;
  }
  if (event === 'issues' || event === 'issue_comment') {
    return payload.issue?.title;
  }
  if (event === 'release') {
    return payload.release?.name ?? payload.release?.tag_name;
  }
  if (event === 'repository_dispatch') {
    return payload.action;
  }
  if (event === 'ping') {
    return firstLine(payload.zen);
  }
  return payload.action;
}

function hookSummary(event: string, payload: GithubPayload): string | undefined {
  if (event === 'push') {
    const branch = payload.ref?.replace(/^refs\/heads\//, '');
    const commit = firstLine(payload.head_commit?.message);
    return [branch, commit].filter(Boolean).join(' · ') || undefined;
  }
  if (event === 'workflow_run') {
    const run = payload.workflow_run;
    const state = run?.conclusion ?? run?.status;
    return [run?.name ?? run?.display_title, run?.head_branch, state]
      .filter(Boolean)
      .join(' · ');
  }
  if (event === 'workflow_job') {
    const job = payload.workflow_job;
    const state = job?.conclusion ?? job?.status;
    return [job?.workflow_name ?? job?.name, state].filter(Boolean).join(' · ');
  }
  if (event === 'pull_request') {
    return [payload.action, payload.pull_request?.title]
      .filter(Boolean)
      .join(' · ');
  }
  if (event === 'issues' || event === 'issue_comment') {
    return [payload.action, payload.issue?.title].filter(Boolean).join(' · ');
  }
  if (event === 'release') {
    return [payload.action, payload.release?.tag_name ?? payload.release?.name]
      .filter(Boolean)
      .join(' · ');
  }
  if (event === 'repository_dispatch') {
    return payload.action;
  }
  return payload.action;
}

export function applyGithubEvent(
  store: MemoryStore,
  input: ApplyGithubEventInput,
): void {
  const repo = repoFrom(input.payload);
  const componentId = repo?.full_name;
  const receivedAt = input.receivedAt ?? new Date().toISOString();

  store.addHook({
    id: input.deliveryId,
    event: input.event,
    receivedAt,
    componentId,
    actor: input.payload.sender?.login,
    action: input.payload.action,
    title: hookTitle(input.event, input.payload),
    summary: hookSummary(input.event, input.payload),
    payload: input.payload,
  });

  if (componentId) {
    store.upsertComponent({
      id: componentId,
      name: repo?.name ?? componentId.split('/').pop() ?? componentId,
    });
  }

  const people = collectPeople(input.payload);
  for (const person of people) {
    const handle = person.login as string;
    store.upsertEmployee({
      id: handle,
      handle,
      name: person.name,
    });
    if (componentId) {
      const kinds: RelationshipKind[] = ['works_on'];
      if (input.event === 'pull_request' && input.payload.pull_request) {
        kinds.push('authored');
      }
      for (const kind of kinds) {
        store.upsertRelationship(handle, componentId, kind);
      }
    }
  }
}
