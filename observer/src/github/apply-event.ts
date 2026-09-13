import type { RelationshipKind } from '@afterglow-ai/shared';
import { MemoryStore } from '../store/memory.store';

type GithubUser = { login?: string; name?: string };
type GithubRepo = { full_name?: string; name?: string };
type GithubPayload = {
  sender?: GithubUser;
  repository?: GithubRepo;
  pull_request?: { user?: GithubUser; merged?: boolean };
  issue?: { user?: GithubUser };
  release?: { author?: GithubUser };
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

export function applyGithubEvent(
  store: MemoryStore,
  input: ApplyGithubEventInput,
): void {
  const repo = input.payload.repository;
  const componentId = repo?.full_name;
  const receivedAt = input.receivedAt ?? new Date().toISOString();

  store.addHook({
    id: input.deliveryId,
    event: input.event,
    receivedAt,
    componentId,
  });

  if (componentId && repo?.name) {
    store.upsertComponent({ id: componentId, name: repo.name });
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
