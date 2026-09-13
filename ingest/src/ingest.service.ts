import { Injectable, NotFoundException } from '@nestjs/common';
import {
  openDefaultStore,
  type Employee,
  type Component,
  type KnowledgeDocument,
  type MemoryStore,
  type Seed,
  type SeedSource,
  type WatchedRepo,
} from '@afterglow-ai/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class IngestService {
  private readonly store: MemoryStore;

  constructor() {
    this.store = openDefaultStore();
  }

  putInstruction(body: string) {
    return this.store.putInstruction(body.trim());
  }

  getInstruction() {
    return this.store.getInstruction();
  }

  addSeed(input: {
    source?: SeedSource;
    title?: string;
    body?: string;
    url?: string;
    componentId?: string;
    evidenceKind?: string;
    evidenceRef?: string;
  }): Seed {
    const source = input.source ?? (input.url ? 'url' : 'paste');
    const evidenceRef =
      input.evidenceRef ?? input.url ?? (input.body ? 'paste' : 'unknown');
    const seed: Seed = {
      id: randomUUID(),
      source,
      status: source === 'connector' ? 'pending' : 'accepted',
      title: input.title,
      body: input.body,
      evidence: {
        kind: input.evidenceKind ?? (input.url ? 'url' : 'paste'),
        ref: evidenceRef,
      },
      componentId: input.componentId,
      createdAt: new Date().toISOString(),
    };
    return this.store.addSeed(seed);
  }

  addConnectorSeed(input: {
    provider: string;
    ref: string;
    title?: string;
    componentId?: string;
  }): Seed {
    return this.addSeed({
      source: 'connector',
      title: input.title ?? `${input.provider}:${input.ref}`,
      evidenceKind: input.provider,
      evidenceRef: input.ref,
      componentId: input.componentId,
    });
  }

  getSeed(id: string): Seed {
    const seed = this.store.getSeed(id);
    if (!seed) {
      throw new NotFoundException(`seed ${id} not found`);
    }
    return seed;
  }

  listSeeds(): Seed[] {
    return this.store.listSeeds();
  }

  putMap(input: {
    employees?: Employee[];
    components?: Component[];
    documents?: KnowledgeDocument[];
    watchedRepos?: WatchedRepo[];
  }) {
    return this.store.putMap(input);
  }

  getMap() {
    return this.store.getMap();
  }

  summary() {
    return this.store.summary();
  }
}
