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
};

export type DocCount = {
  componentId: string;
  count: number;
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
