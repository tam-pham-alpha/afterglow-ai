# Afterglow × Engineering Society — product boundary

> **Status:** Proposed  
> **Date:** 2026-09-14  
> **Scope:** Product / architecture boundary  
> **Related:** [Afterglow README](../README.md), [_docs README](./README.md)

## Context

Afterglow starts from a narrow thesis: **give an organization memory**.

Its core job is to observe real work artifacts, resolve the context around changes, and preserve durable **Decisions** with traceable evidence.

A separate idea, **Engineering Society**, is emerging around Claude/LLM agents living in Discord and behaving more like persistent engineering collaborators: architect, SRE, reviewer, mentor, investigator, and similar roles.

The key product question is whether these two ideas should become one product, or whether Engineering Society should build on top of Afterglow.

## Decision

**Keep Afterglow as the organizational-memory substrate. Build Engineering Society as an application layer on top of Afterglow.**

Afterglow should know what the organization knows.

Engineering Society should turn that memory into agents engineers can talk to.

```text
                 Engineering Society
        ┌──────────────────────────────┐
        │ Claude / LLM                 │
        │ Discord                      │
        │ Sessions                     │
        │ Roles / personas             │
        │ Collaboration                │
        │ Agent tools                  │
        └──────────────┬───────────────┘
                       │
                 Afterglow MCP
                       │
        ┌──────────────▼───────────────┐
        │          Afterglow           │
        │                              │
        │ Company memory               │
        │ Decisions                    │
        │ Services / Employees         │
        │ Incidents                    │
        │ Evidence / relationships     │
        │ Historical context           │
        └──────────────┬───────────────┘
                       │
          GitHub / Notion / Jira /
          Slack / Docs / other MCPs
```

Engineering Society is therefore a **consumer of Afterglow**, not a new responsibility inside Afterglow core.

## Responsibilities

### Afterglow

Afterglow owns durable organizational knowledge:

- observe GitHub events that indicate something actually changed
- resolve supporting context from GitHub and external MCP sources
- identify and store Decisions
- connect Decisions to services, employees, incidents, PRs, documents, and evidence
- preserve history instead of overwriting old decisions
- expose company memory through Afterglow MCP / web

Typical queries:

```text
why_decision("Aeron")
service_history("RFQ Gateway")
similar_incidents("Tokyo latency spike")
who_knows("ZeroHash")
employee_context("Tam", "ZeroHash")
what_changed("SDP", since)
```

Afterglow does **not** need to know whether the caller is Discord, Claude, Cursor, ChatGPT, a web app, or another agent product.

### Engineering Society

Engineering Society owns the interaction and agent layer:

- Discord interface
- Claude / LLM execution
- session lifecycle
- role-specific instructions
- agent personas such as SRE, architect, reviewer, mentor
- short-term conversational context
- collaboration between agents and humans
- tool orchestration
- deciding when to ask Afterglow for organizational memory

Examples:

```text
@architect
@sre
@security
@backend
@new-hire-mentor
```

A user might ask:

```text
@sre why did Tokyo latency spike after the Nexus deploy?
```

Engineering Society can combine the current conversation with Afterglow MCP:

```text
Discord
  ↓
SRE agent
  ↓
Claude
  ↓
Afterglow MCP
  ↓
similar_incidents(...)
service_history(...)
why_decision(...)
  ↓
Decision + Incident + PR + evidence
  ↓
reasoned answer to the engineer
```

## The important write boundary

**Engineering Society conversations must not automatically become Afterglow memory.**

For example:

```text
Engineer: maybe we should migrate Redis to Dragonfly.
Agent: that could make sense.
```

This is discussion, not organizational truth.

It should not create a Decision merely because an LLM conversation happened.

The durable path remains:

```text
discussion
   ↓
ticket / design / implementation
   ↓
PR merged / issue closed / deploy
   ↓
observer sees real event
   ↓
resolver finds relevant context
   ↓
Decision stored with evidence
```

This prevents Afterglow from becoming a giant AI chat-history database and preserves its core thesis: **knowledge is interpretation over evidence from real work**.

Engineering Society may provide useful evidence to a resolver later, but a chat message alone is not enough to promote an idea into company memory.

## Why this separation matters

### 1. Afterglow stays model- and UI-agnostic

Claude is one reasoning engine. Discord is one interface.

If both are embedded into Afterglow core, Afterglow becomes tied to today's preferred interaction model.

By keeping the boundary clean, the same memory can serve:

```text
Claude
Cursor
ChatGPT
Discord
Slack
Web
CLI
future agent runtimes
```

### 2. One memory can support many products

Engineering Society can be the first application, but not the only one.

```text
                     Afterglow
                        │
       ┌────────────────┼──────────────────┐
       │                │                  │
Engineering Society  Incident AI     Onboarding AI
       │                │                  │
    Discord           Pager            Web / Slack
```

Other consumers could later include:

- CTO copilot
- architecture reviewer
- incident investigator
- code-review agent
- new-engineer assistant
- service-owner assistant

These products should reuse the same organizational memory rather than each building its own knowledge silo.

### 3. Engineering Society can move faster

Agent UX changes quickly.

Discord workflows, session semantics, model choices, personas, routing, and tool orchestration are product experiments.

They should be able to evolve without changing the organizational-memory model.

Likewise, Afterglow can improve resolver quality, evidence handling, Decision extraction, and retrieval without needing to understand Discord UX.

### 4. The central thesis remains testable

The first proof for Afterglow remains:

```text
instruction
→ PR merged
→ observer sees event
→ correct context is found
→ Decision stored with evidence
→ MCP can explain why the decision exists
```

Engineering Society should not expand that proof surface prematurely.

Its first proof can instead be:

```text
engineer asks a real question in Discord
→ agent recognizes what company context is required
→ queries Afterglow MCP
→ receives correct Decision / incident / service history
→ gives a useful, traceable answer
```

The two products therefore prove different things.

## Relationship to a Claude session

A Claude Code session in a repository feels useful because it has:

- source code
- local instructions
- project docs
- tools
- short-term conversation context

Engineering Society can provide a similar experience at organization scope:

```text
Claude Code session
    ↓
repo context
    ↓
one codebase
```

becomes:

```text
Engineering Society session
    ↓
Afterglow
    ↓
organization context
    ↓
services + decisions + incidents + evidence
```

The agent gains access to durable organizational memory without requiring that memory to live inside its session.

## Repository boundary

Do **not** add Engineering Society runtime code to the Afterglow monorepo yet.

Current Afterglow boundaries should remain:

```text
afterglow-ai/
  shared/
  ingest/
  observer/
  mcp/
  web/
  health-monitor/
  _docs/
```

Engineering Society should begin as a separate consumer:

```text
engineering-society/
  discord/
  agents/
  sessions/
  tools/

        ↓

  Afterglow MCP
```

This also makes Engineering Society a useful dogfood client for Afterglow.

If integrating the two later unlocks a concrete product proof, the boundary can be revisited. Until then, keeping them separate is simpler and prevents interaction-layer concerns from leaking into the memory substrate.

## Product framing

A concise way to describe the distinction:

> **Afterglow gives the organization memory.**  
> **Engineering Society gives that memory agents people can talk to.**

Another framing:

> **Afterglow knows why the organization became the way it is.**  
> **Engineering Society uses that knowledge to help engineers work.**

The first statement should remain the stronger product thesis for Afterglow.

## Alternatives considered

### Put Engineering Society inside Afterglow

**Rejected for now.**

This would make Afterglow simultaneously responsible for organizational memory, LLM runtime, Discord UX, agent personas, sessions, and collaboration.

That increases implementation surface without improving the current first proof.

It would also blur the boundary between durable company knowledge and ephemeral AI conversation.

### Make Engineering Society own its own knowledge store

**Rejected.**

This recreates the same memory problem per application.

Different agents would develop different copies of company truth, and knowledge would become coupled to the interface consuming it.

The memory layer should stay independent and reusable.

### Store every Engineering Society conversation in Afterglow

**Rejected.**

Conversation is evidence at most, not the primary knowledge unit.

Afterglow should preserve Decisions grounded in real work artifacts, not become a transcript archive.

## Consequences

Positive:

- Afterglow keeps a narrow and defensible thesis
- Engineering Society can experiment independently
- organizational memory becomes reusable infrastructure
- Claude/Discord are replaceable clients rather than architectural dependencies
- the same Decision history can power multiple future products
- conversation noise does not pollute durable memory

Trade-offs:

- Engineering Society needs a clean Afterglow MCP contract
- some context may exist only in an active conversation and remain intentionally ephemeral
- identity and authorization across the two systems need a clear boundary later
- there may eventually be evidence originating from Engineering Society that the resolver should follow, but promotion into memory must still require evidence and a real organizational event

## What would cause this decision to change

Revisit this boundary if one of these becomes true:

1. Engineering Society requires capabilities that fundamentally belong in the organizational-memory layer rather than the interaction layer.
2. Keeping separate runtimes creates significant duplicated logic around identity, authorization, or retrieval that cannot be expressed through MCP/contracts cleanly.
3. A concrete first-proof use case requires an Engineering Society event to become a first-class organizational event.
4. Afterglow evolves from memory substrate into an explicitly broader organizational agent platform.

Until then, prefer the smaller architecture:

**Afterglow remembers. Engineering Society interacts.**
