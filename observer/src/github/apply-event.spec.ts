import { MemoryStore } from '@afterglow-ai/shared';
import { applyGithubEvent } from './apply-event';

describe('applyGithubEvent', () => {
  it('counts the hook and links author to the repo component', () => {
    const store = new MemoryStore(null);
    applyGithubEvent(store, {
      deliveryId: 'abc',
      event: 'pull_request',
      receivedAt: '2026-09-13T04:00:00.000Z',
      payload: {
        sender: { login: 'tam-pham-alpha' },
        repository: { full_name: 'tam-pham-alpha/afterglow-ai', name: 'afterglow-ai' },
        pull_request: { user: { login: 'tam-pham-alpha' }, merged: true },
      },
    });

    const snap = store.overview();
    expect(snap.hooks.total).toBe(1);
    expect(snap.hooks.byEvent.pull_request).toBe(1);
    expect(snap.employees.total).toBe(1);
    expect(snap.components.total).toBe(1);
    expect(snap.relationships.total).toBe(2);
    expect(snap.relationships.items.map((row) => row.kind).sort()).toEqual([
      'authored',
      'works_on',
    ]);
    expect(snap.docs.byComponent).toEqual([
      { componentId: 'tam-pham-alpha/afterglow-ai', count: 0 },
    ]);
  });

  it('still records a ping with no repo', () => {
    const store = new MemoryStore(null);
    applyGithubEvent(store, {
      deliveryId: 'ping-1',
      event: 'ping',
      payload: { sender: { login: 'github' } },
    });
    const snap = store.overview();
    expect(snap.hooks.total).toBe(1);
    expect(snap.components.total).toBe(0);
    expect(snap.employees.items[0].handle).toBe('github');
  });

  it('keeps repo, actor, and a short summary for djao-trading workflow events', () => {
    const store = new MemoryStore(null);
    applyGithubEvent(store, {
      deliveryId: 'wf-1',
      event: 'workflow_run',
      receivedAt: '2026-09-17T14:42:00.000Z',
      payload: {
        action: 'completed',
        sender: { login: 'tam-pham-alpha' },
        repository: {
          full_name: 'tam-pham-alpha/djao-trading',
          name: 'djao-trading',
        },
        workflow_run: {
          name: 'Deploy PAVN',
          head_branch: 'main',
          conclusion: 'success',
        },
      },
    });

    expect(store.events().items[0]).toMatchObject({
      id: 'wf-1',
      event: 'workflow_run',
      componentId: 'tam-pham-alpha/djao-trading',
      componentName: 'djao-trading',
      actor: 'tam-pham-alpha',
      action: 'completed',
      title: 'Deploy PAVN',
      summary: 'Deploy PAVN · main · success',
      hasPayload: true,
    });
    expect(store.events().items[0]).not.toHaveProperty('payload');
    expect(store.getHook('wf-1')?.payload).toMatchObject({
      workflow_run: { name: 'Deploy PAVN' },
    });
  });

  it('uses the commit message as the push title', () => {
    const store = new MemoryStore(null);
    applyGithubEvent(store, {
      deliveryId: 'push-1',
      event: 'push',
      payload: {
        ref: 'refs/heads/main',
        sender: { login: 'tam-pham-alpha' },
        repository: {
          full_name: 'tam-pham-alpha/djao-trading',
          name: 'djao-trading',
        },
        head_commit: { message: 'fix smee truncation\n\nlonger body' },
      },
    });
    expect(store.events().items[0].title).toBe('fix smee truncation');
    expect(store.events().items[0].summary).toBe(
      'main · fix smee truncation',
    );
  });
});
