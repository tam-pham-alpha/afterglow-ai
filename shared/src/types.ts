export type RelationshipKind = 'works_on' | 'authored';

export type Employee = {
  id: string;
  handle: string;
  name?: string;
};

export type Component = {
  id: string;
  name: string;
};

export type Relationship = {
  employeeId: string;
  componentId: string;
  kind: RelationshipKind;
};

export type HookEvent = {
  id: string;
  event: string;
  receivedAt: string;
  componentId?: string;
  actor?: string;
  action?: string;
  summary?: string;
};

export type HookEventView = HookEvent & {
  componentName?: string;
};

export type EventsSnapshot = {
  generatedAt: string;
  total: number;
  items: HookEventView[];
};

export type DocCount = {
  componentId: string;
  count: number;
};

export type KnowledgeDocument = {
  id: string;
  title: string;
  componentId?: string;
  topic?: string;
};

export type WatchedRepo = {
  repo: string;
  componentId?: string;
};

export type SeedSource = 'paste' | 'url' | 'upload' | 'connector';
export type SeedStatus = 'accepted' | 'pending' | 'failed';

export type Seed = {
  id: string;
  source: SeedSource;
  status: SeedStatus;
  title?: string;
  body?: string;
  evidence: { kind: string; ref: string };
  componentId?: string;
  createdAt: string;
};

export type InstructionRecord = {
  current: string;
  versions: Array<{ at: string; body: string }>;
};

export type MapSnapshot = {
  employees: Employee[];
  components: Component[];
  documents: KnowledgeDocument[];
  watchedRepos: WatchedRepo[];
};

export type OverviewSnapshot = {
  generatedAt: string;
  hooks: {
    total: number;
    byEvent: Record<string, number>;
  };
  employees: {
    total: number;
    items: Employee[];
  };
  components: {
    total: number;
    items: Component[];
  };
  relationships: {
    total: number;
    items: Array<{
      employeeId: string;
      employeeHandle: string;
      componentId: string;
      componentName: string;
      kind: RelationshipKind;
    }>;
  };
  docs: {
    total: number;
    byComponent: DocCount[];
  };
};
