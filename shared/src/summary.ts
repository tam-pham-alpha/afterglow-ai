import type {
  Component,
  Employee,
  HookEvent,
  InstructionRecord,
  MemorySummary,
  MemorySummaryComponent,
  MemorySummaryHook,
  MemorySummaryPerson,
  MemorySummarySeed,
  Relationship,
  Seed,
  WatchedRepo,
} from './types';

export type SummarySource = {
  hooks: HookEvent[];
  employees: Record<string, Employee>;
  components: Record<string, Component>;
  relationships: Record<string, Relationship>;
  docs: Record<string, number>;
  instruction: InstructionRecord;
  seeds: Record<string, Seed>;
  watchedRepos: WatchedRepo[];
};

const EXCERPT_LIMIT = 220;
const RECENT_HOOK_LIMIT = 8;

export function excerpt(text: string, limit = EXCERPT_LIMIT): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= limit) {
    return collapsed;
  }
  return `${collapsed.slice(0, limit).trimEnd()}…`;
}

export function summarizeMemory(
  state: SummarySource,
  generatedAt = new Date().toISOString(),
): MemorySummary {
  const instructionSet = Boolean(state.instruction.current.trim());
  const people = peopleFrom(state);
  const components = componentsFrom(state);
  const seeds = seedsFrom(state);
  const recentHooks = recentHooksFrom(state);
  const watchedRepos = state.watchedRepos.map((item) => item.repo);
  const gaps = gapsFrom({
    instructionSet,
    people: people.length,
    components: components.length,
    seeds: seeds.length,
    hooks: state.hooks.length,
  });
  const headline = headlineFrom({
    instructionSet,
    people: people.length,
    components: components.length,
    seeds: seeds.filter((seed) => seed.status === 'accepted').length,
    hooks: state.hooks.length,
  });
  const body = bodyFrom({
    instructionSet,
    excerpt: excerpt(state.instruction.current),
    people,
    components,
    seeds,
    recentHooks,
    watchedRepos,
  });
  const summary: MemorySummary = {
    generatedAt,
    headline,
    body,
    gaps,
    text: '',
    instruction: {
      set: instructionSet,
      excerpt: excerpt(state.instruction.current),
      previousVersions: state.instruction.versions.length,
    },
    people,
    components,
    seeds,
    recentHooks,
    watchedRepos,
  };
  summary.text = formatSummaryText(summary);
  return summary;
}

function peopleFrom(state: SummarySource): MemorySummaryPerson[] {
  const byHandle = new Map<string, MemorySummaryPerson>();
  for (const employee of Object.values(state.employees)) {
    byHandle.set(employee.handle, { handle: employee.handle, links: [] });
  }
  for (const rel of Object.values(state.relationships)) {
    const handle = state.employees[rel.employeeId]?.handle ?? rel.employeeId;
    const component =
      state.components[rel.componentId]?.name ?? rel.componentId;
    const person = byHandle.get(handle) ?? { handle, links: [] };
    if (
      !person.links.some(
        (link) => link.component === component && link.kind === rel.kind,
      )
    ) {
      person.links.push({ component, kind: rel.kind });
    }
    byHandle.set(handle, person);
  }
  return [...byHandle.values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

function componentsFrom(state: SummarySource): MemorySummaryComponent[] {
  const hookCounts: Record<string, number> = {};
  for (const hook of state.hooks) {
    if (!hook.componentId) {
      continue;
    }
    hookCounts[hook.componentId] = (hookCounts[hook.componentId] ?? 0) + 1;
  }
  return Object.values(state.components)
    .map((component) => ({
      id: component.id,
      name: component.name,
      docs: state.docs[component.id] ?? 0,
      hooks: hookCounts[component.id] ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function seedsFrom(state: SummarySource): MemorySummarySeed[] {
  return Object.values(state.seeds)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((seed) => ({
      id: seed.id,
      title: seed.title ?? seed.id,
      status: seed.status,
      evidence: seed.evidence.ref,
    }));
}

function recentHooksFrom(state: SummarySource): MemorySummaryHook[] {
  return [...state.hooks]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, RECENT_HOOK_LIMIT)
    .map((hook) => ({
      event: hook.event,
      receivedAt: hook.receivedAt,
      componentId: hook.componentId,
    }));
}

function gapsFrom(input: {
  instructionSet: boolean;
  people: number;
  components: number;
  seeds: number;
  hooks: number;
}): string[] {
  const gaps: string[] = [];
  if (!input.instructionSet) {
    gaps.push('No instruction — the resolver will not know how to read this org.');
  }
  if (input.people === 0 && input.components === 0) {
    gaps.push('No map yet — no people or components in memory.');
  }
  if (input.seeds === 0) {
    gaps.push('No seeds — no ADR or postmortem evidence yet.');
  }
  if (input.hooks === 0) {
    gaps.push('No GitHub events — observer has not heard a real change.');
  }
  gaps.push('No decision records yet — first proof still needs a merged PR written as a decision.');
  return gaps;
}

function headlineFrom(input: {
  instructionSet: boolean;
  people: number;
  components: number;
  seeds: number;
  hooks: number;
}): string {
  if (
    !input.instructionSet &&
    input.people === 0 &&
    input.components === 0 &&
    input.seeds === 0 &&
    input.hooks === 0
  ) {
    return 'Memory is empty.';
  }
  const bits: string[] = [];
  if (input.instructionSet) {
    bits.push('Instruction is set');
  }
  if (input.hooks > 0) {
    bits.push(
      `${input.hooks} GitHub event${input.hooks === 1 ? '' : 's'} heard`,
    );
  }
  if (input.people > 0) {
    bits.push(`${input.people} ${input.people === 1 ? 'person' : 'people'}`);
  }
  if (input.components > 0) {
    bits.push(
      `${input.components} component${input.components === 1 ? '' : 's'}`,
    );
  }
  if (input.seeds > 0) {
    bits.push(`${input.seeds} seed${input.seeds === 1 ? '' : 's'}`);
  }
  return `${bits.join('. ')}.`;
}

function bodyFrom(input: {
  instructionSet: boolean;
  excerpt: string;
  people: MemorySummaryPerson[];
  components: MemorySummaryComponent[];
  seeds: MemorySummarySeed[];
  recentHooks: MemorySummaryHook[];
  watchedRepos: string[];
}): string {
  const parts: string[] = [];
  if (input.instructionSet) {
    parts.push(`How this org is read: ${input.excerpt}`);
  } else {
    parts.push(
      'No instruction is loaded. Afterglow will not invent how to read this org.',
    );
  }

  if (input.people.length) {
    const lines = input.people.map((person) => {
      if (!person.links.length) {
        return person.handle;
      }
      const links = person.links
        .map((link) => `${link.kind} ${link.component}`)
        .join(', ');
      return `${person.handle} (${links})`;
    });
    parts.push(`People: ${lines.join('; ')}.`);
  }

  if (input.components.length) {
    const lines = input.components.map((component) => {
      const extra = [
        component.hooks ? `${component.hooks} hook${component.hooks === 1 ? '' : 's'}` : null,
        component.docs ? `${component.docs} doc${component.docs === 1 ? '' : 's'}` : null,
      ].filter(Boolean);
      return extra.length
        ? `${component.name} (${extra.join(', ')})`
        : component.name;
    });
    parts.push(`Components: ${lines.join('; ')}.`);
  }

  if (input.seeds.length) {
    const lines = input.seeds.map(
      (seed) => `${seed.status} · ${seed.title} · ${seed.evidence}`,
    );
    parts.push(`Seeds: ${lines.join('; ')}.`);
  }

  if (input.watchedRepos.length) {
    parts.push(`Watched repos: ${input.watchedRepos.join(', ')}.`);
  }

  if (input.recentHooks.length) {
    const lines = input.recentHooks.map((hook) =>
      hook.componentId ? `${hook.event} on ${hook.componentId}` : hook.event,
    );
    parts.push(`Recent events: ${lines.join(', ')}.`);
  }

  return parts.join('\n\n');
}

function formatSummaryText(summary: MemorySummary): string {
  const lines = [
    summary.headline,
    '',
    summary.body,
    '',
    'Gaps',
    ...summary.gaps.map((gap) => `- ${gap}`),
  ];
  return lines.join('\n').trim();
}

