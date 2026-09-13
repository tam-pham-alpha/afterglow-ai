import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type {
  Component,
  DocCount,
  Employee,
  HookEvent,
  InstructionRecord,
  KnowledgeDocument,
  MapSnapshot,
  OverviewSnapshot,
  Relationship,
  RelationshipKind,
  Seed,
  WatchedRepo,
} from '../types';

export type MemoryState = {
  hooks: HookEvent[];
  employees: Record<string, Employee>;
  components: Record<string, Component>;
  relationships: Record<string, Relationship>;
  docs: Record<string, number>;
  instruction: InstructionRecord;
  seeds: Record<string, Seed>;
  documents: Record<string, KnowledgeDocument>;
  watchedRepos: WatchedRepo[];
};

export function emptyState(): MemoryState {
  return {
    hooks: [],
    employees: {},
    components: {},
    relationships: {},
    docs: {},
    instruction: { current: '', versions: [] },
    seeds: {},
    documents: {},
    watchedRepos: [],
  };
}

export function relationshipKey(
  employeeId: string,
  componentId: string,
  kind: RelationshipKind,
): string {
  return `${employeeId}::${componentId}::${kind}`;
}

export function openDefaultStore(): MemoryStore {
  const dataDir = process.env.AFTERGLOW_DATA_DIR ?? '.data';
  return MemoryStore.load(join(dataDir, 'memory.json'));
}

export class MemoryStore {
  constructor(
    private readonly filePath: string | null,
    private state: MemoryState = emptyState(),
  ) {}

  static load(filePath: string): MemoryStore {
    try {
      const raw = readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<MemoryState>;
      return new MemoryStore(filePath, {
        ...emptyState(),
        ...parsed,
        employees: parsed.employees ?? {},
        components: parsed.components ?? {},
        relationships: parsed.relationships ?? {},
        docs: parsed.docs ?? {},
        hooks: parsed.hooks ?? [],
        instruction: parsed.instruction ?? { current: '', versions: [] },
        seeds: parsed.seeds ?? {},
        documents: parsed.documents ?? {},
        watchedRepos: parsed.watchedRepos ?? [],
      });
    } catch {
      return new MemoryStore(filePath, emptyState());
    }
  }

  persist(): void {
    if (!this.filePath) {
      return;
    }
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  addHook(hook: HookEvent): void {
    this.state.hooks.push(hook);
    this.persist();
  }

  upsertEmployee(employee: Employee): void {
    const current = this.state.employees[employee.id];
    this.state.employees[employee.id] = {
      ...current,
      ...employee,
    };
    this.persist();
  }

  upsertComponent(component: Component): void {
    const current = this.state.components[component.id];
    this.state.components[component.id] = {
      ...current,
      ...component,
    };
    if (this.state.docs[component.id] === undefined) {
      this.state.docs[component.id] = 0;
    }
    this.persist();
  }

  upsertRelationship(
    employeeId: string,
    componentId: string,
    kind: RelationshipKind,
  ): void {
    const key = relationshipKey(employeeId, componentId, kind);
    this.state.relationships[key] = { employeeId, componentId, kind };
    this.persist();
  }

  setDocCount(componentId: string, count: number): void {
    this.state.docs[componentId] = count;
    this.persist();
  }

  putInstruction(body: string): InstructionRecord {
    const at = new Date().toISOString();
    if (this.state.instruction.current) {
      this.state.instruction.versions.push({
        at,
        body: this.state.instruction.current,
      });
    }
    this.state.instruction.current = body;
    this.persist();
    return this.getInstruction();
  }

  getInstruction(): InstructionRecord {
    return {
      current: this.state.instruction.current,
      versions: [...this.state.instruction.versions],
    };
  }

  addSeed(seed: Seed): Seed {
    this.state.seeds[seed.id] = seed;
    if (seed.status === 'accepted') {
      const docId = `seed:${seed.id}`;
      this.state.documents[docId] = {
        id: docId,
        title: seed.title ?? seed.id,
        componentId: seed.componentId,
      };
      if (seed.componentId) {
        this.upsertComponent({
          id: seed.componentId,
          name: seed.componentId.split('/').pop() ?? seed.componentId,
        });
        this.state.docs[seed.componentId] =
          (this.state.docs[seed.componentId] ?? 0) + 1;
      }
    }
    this.persist();
    return seed;
  }

  getSeed(id: string): Seed | undefined {
    return this.state.seeds[id];
  }

  listSeeds(): Seed[] {
    return Object.values(this.state.seeds).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  putMap(input: {
    employees?: Employee[];
    components?: Component[];
    documents?: KnowledgeDocument[];
    watchedRepos?: WatchedRepo[];
  }): MapSnapshot {
    for (const employee of input.employees ?? []) {
      this.upsertEmployee(employee);
    }
    for (const component of input.components ?? []) {
      this.upsertComponent(component);
    }
    if (input.documents) {
      this.state.documents = {};
      for (const doc of input.documents) {
        this.state.documents[doc.id] = doc;
        if (doc.componentId) {
          this.upsertComponent({
            id: doc.componentId,
            name: doc.componentId.split('/').pop() ?? doc.componentId,
          });
        }
      }
      this.recountDocs();
    }
    if (input.watchedRepos) {
      this.state.watchedRepos = input.watchedRepos;
    }
    this.persist();
    return this.getMap();
  }

  getMap(): MapSnapshot {
    return {
      employees: Object.values(this.state.employees).sort((a, b) =>
        a.handle.localeCompare(b.handle),
      ),
      components: Object.values(this.state.components).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      documents: Object.values(this.state.documents).sort((a, b) =>
        a.title.localeCompare(b.title),
      ),
      watchedRepos: [...this.state.watchedRepos],
    };
  }

  private recountDocs(): void {
    const next: Record<string, number> = {};
    for (const id of Object.keys(this.state.components)) {
      next[id] = 0;
    }
    for (const doc of Object.values(this.state.documents)) {
      if (!doc.componentId) {
        continue;
      }
      next[doc.componentId] = (next[doc.componentId] ?? 0) + 1;
    }
    this.state.docs = next;
  }

  overview(): OverviewSnapshot {
    const byEvent: Record<string, number> = {};
    for (const hook of this.state.hooks) {
      byEvent[hook.event] = (byEvent[hook.event] ?? 0) + 1;
    }

    const employees = Object.values(this.state.employees).sort((a, b) =>
      a.handle.localeCompare(b.handle),
    );
    const components = Object.values(this.state.components).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const relationships = Object.values(this.state.relationships)
      .map((rel) => ({
        employeeId: rel.employeeId,
        employeeHandle:
          this.state.employees[rel.employeeId]?.handle ?? rel.employeeId,
        componentId: rel.componentId,
        componentName:
          this.state.components[rel.componentId]?.name ?? rel.componentId,
        kind: rel.kind,
      }))
      .sort((a, b) =>
        `${a.employeeHandle}${a.componentName}${a.kind}`.localeCompare(
          `${b.employeeHandle}${b.componentName}${b.kind}`,
        ),
      );

    const byComponent: DocCount[] = components.map((component) => ({
      componentId: component.id,
      count: this.state.docs[component.id] ?? 0,
    }));
    const totalDocs = Object.values(this.state.docs).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      generatedAt: new Date().toISOString(),
      hooks: { total: this.state.hooks.length, byEvent },
      employees: { total: employees.length, items: employees },
      components: { total: components.length, items: components },
      relationships: { total: relationships.length, items: relationships },
      docs: { total: totalDocs, byComponent },
    };
  }
}
