import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MemoryStore } from '@afterglow-ai/shared';

describe('MemoryStore', () => {
  const dir = mkdtempSync(join(tmpdir(), 'afterglow-store-'));
  const file = join(dir, 'memory.json');

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('builds an empty overview', () => {
    const store = new MemoryStore(null);
    const snap = store.overview();
    expect(snap.hooks.total).toBe(0);
    expect(snap.employees.total).toBe(0);
    expect(snap.components.total).toBe(0);
    expect(snap.relationships.total).toBe(0);
    expect(snap.docs.total).toBe(0);
  });

  it('records hooks, people, components, relationships, and docs', () => {
    const store = new MemoryStore(file);
    store.addHook({
      id: 'd1',
      event: 'pull_request',
      receivedAt: '2026-09-13T00:00:00.000Z',
      componentId: 'org/afterglow-ai',
    });
    store.upsertEmployee({ id: 'tam', handle: 'tam' });
    store.upsertComponent({ id: 'org/afterglow-ai', name: 'afterglow-ai' });
    store.upsertRelationship('tam', 'org/afterglow-ai', 'works_on');
    store.setDocCount('org/afterglow-ai', 3);

    const snap = store.overview();
    expect(snap.hooks.total).toBe(1);
    expect(snap.hooks.byEvent.pull_request).toBe(1);
    expect(snap.employees.total).toBe(1);
    expect(snap.components.items[0].name).toBe('afterglow-ai');
    expect(snap.relationships.items[0]).toMatchObject({
      employeeHandle: 'tam',
      componentName: 'afterglow-ai',
      kind: 'works_on',
    });
    expect(snap.docs.total).toBe(3);
    expect(snap.docs.byComponent).toEqual([
      { componentId: 'org/afterglow-ai', count: 3 },
    ]);

    const reloaded = MemoryStore.load(file);
    expect(reloaded.overview().docs.total).toBe(3);
  });
});
