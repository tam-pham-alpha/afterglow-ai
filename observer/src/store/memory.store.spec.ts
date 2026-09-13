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

  it('summarizes empty memory without inventing facts', () => {
    const store = new MemoryStore(null);
    const summary = store.summary();
    expect(summary.headline).toBe('Memory is empty.');
    expect(summary.instruction.set).toBe(false);
    expect(summary.people).toEqual([]);
    expect(summary.components).toEqual([]);
    expect(summary.gaps).toEqual(
      expect.arrayContaining([
        expect.stringContaining('No instruction'),
        expect.stringContaining('No GitHub events'),
        expect.stringContaining('No decision records'),
      ]),
    );
    expect(summary.text).toContain('Memory is empty.');
  });

  it('summarizes instruction, people, and events from evidence', () => {
    const store = new MemoryStore(null);
    store.putInstruction('Do not read Slack DMs. PAY- tickets belong to payments.');
    store.addHook({
      id: 'd1',
      event: 'pull_request',
      receivedAt: '2026-09-13T00:00:00.000Z',
      componentId: 'org/afterglow-ai',
    });
    store.upsertEmployee({ id: 'tam', handle: 'tam' });
    store.upsertComponent({ id: 'org/afterglow-ai', name: 'afterglow-ai' });
    store.upsertRelationship('tam', 'org/afterglow-ai', 'authored');
    store.addSeed({
      id: 's1',
      source: 'paste',
      status: 'accepted',
      title: 'Aeron ADR',
      evidence: { kind: 'paste', ref: 'paste' },
      createdAt: '2026-09-13T00:00:00.000Z',
    });

    const summary = store.summary();
    expect(summary.headline).toContain('Instruction is set');
    expect(summary.headline).toContain('1 GitHub event');
    expect(summary.body).toContain('Do not read Slack DMs');
    expect(summary.body).toContain('tam (authored afterglow-ai)');
    expect(summary.body).toContain('Aeron ADR');
    expect(summary.body).toContain('pull_request on org/afterglow-ai');
    expect(summary.people[0].links[0]).toMatchObject({
      component: 'afterglow-ai',
      kind: 'authored',
    });
  });
});
