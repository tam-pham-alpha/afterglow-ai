import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type {
  Component,
  DocCount,
  Employee,
  HookEvent,
  OverviewSnapshot,
  Relationship,
  RelationshipKind,
} from '@afterglow-ai/shared';

export type MemoryState = {
  hooks: HookEvent[];
  employees: Record<string, Employee>;
  components: Record<string, Component>;
  relationships: Record<string, Relationship>;
  docs: Record<string, number>;
};

export function emptyState(): MemoryState {
  return {
    hooks: [],
    employees: {},
    components: {},
    relationships: {},
    docs: {},
  };
}

export function relationshipKey(
  employeeId: string,
  componentId: string,
  kind: RelationshipKind,
): string {
  return `${employeeId}::${componentId}::${kind}`;
}

export class MemoryStore {
  constructor(
    private readonly filePath: string | null,
    private state: MemoryState = emptyState(),
  ) {}

  static load(filePath: string): MemoryStore {
    try {
      const raw = readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as MemoryState;
      return new MemoryStore(filePath, {
        ...emptyState(),
        ...parsed,
        employees: parsed.employees ?? {},
        components: parsed.components ?? {},
        relationships: parsed.relationships ?? {},
        docs: parsed.docs ?? {},
        hooks: parsed.hooks ?? [],
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
