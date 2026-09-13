import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { IngestService } from './ingest.service';

describe('IngestService', () => {
  const dir = mkdtempSync(join(tmpdir(), 'afterglow-ingest-'));

  beforeAll(() => {
    process.env.AFTERGLOW_DATA_DIR = dir;
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('versions instruction and does not let a seed overwrite it', () => {
    const ingest = new IngestService();
    ingest.putInstruction('Do not read DMs.');
    ingest.putInstruction('Do not read DMs. Ticket PAY- is payments.');
    const instruction = ingest.getInstruction();
    expect(instruction.current).toContain('PAY-');
    expect(instruction.versions).toHaveLength(1);
    expect(instruction.versions[0].body).toBe('Do not read DMs.');

    ingest.addSeed({
      body: 'Why we chose Aeron',
      title: 'Aeron ADR',
      componentId: 'org/payments',
    });
    expect(ingest.getInstruction().current).toContain('PAY-');
    expect(ingest.listSeeds()).toHaveLength(1);
    expect(ingest.getMap().documents).toHaveLength(1);
  });

  it('records a connector seed as pending without adding a doc', () => {
    const ingest = new IngestService();
    const seed = ingest.addConnectorSeed({
      provider: 'notion',
      ref: 'page-1',
      componentId: 'org/payments',
    });
    expect(seed.status).toBe('pending');
    expect(seed.evidence.kind).toBe('notion');
  });

  it('upserts map employees, components, and watched repos', () => {
    const ingest = new IngestService();
    const map = ingest.putMap({
      employees: [{ id: 'tam', handle: 'tam' }],
      components: [{ id: 'org/afterglow-ai', name: 'afterglow-ai' }],
      watchedRepos: [{ repo: 'tam-pham-alpha/afterglow-ai' }],
    });
    expect(map.employees[0].handle).toBe('tam');
    expect(map.watchedRepos[0].repo).toBe('tam-pham-alpha/afterglow-ai');
  });
});
