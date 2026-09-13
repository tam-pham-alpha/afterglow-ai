import { MemoryStore } from '../store/memory.store';
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
});
