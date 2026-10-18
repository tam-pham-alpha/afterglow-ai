# AfterglowAI — Living Knowledge Products

> **Status:** Proposed  
> **Date:** 2026-10-18  
> **Scope:** Product vision, commercial layer, memory boundaries, first proof  
> **Related:** [Afterglow README](../README.md), [Afterglow × Engineering Society](./26-09-14-afterglow-engineering-society-boundary.md), [Derived Memory Views](./26-09-14-derived-memory-views-djao-integration.md)

## Summary

**AfterglowAI helps people preserve, evolve, share, and monetize their expertise as living knowledge products.**

> **Where human knowledge becomes a living asset.**

An individual can package their experience, frameworks, decisions, instructions, evidence, and skills into a project other people can interact with. Consumers access it through chat and pay for its value. The creator can improve the product over time using new evidence and carefully reviewed feedback.

This is **not** a proposal to build another general-purpose AI chat UI, bot directory, or digital clone of a person. The defensible asset is an evolving, curated body of knowledge — **not** the prompt, model, chat transcript, or persona.

The existing organizational-memory thesis remains valid. **Organizations are one type of knowledge owner; individual experts are another.** We should explore a commercial product layer on top of the memory substrate, without replacing the current core architecture or losing its evidence-first discipline.

## Context and opportunity

The original Afterglow thesis is:

> Companies do not lack data; they lack memory.

GitHub, PRs, incidents, Slack discussions, and documents are signals. A **Decision**, supported by evidence and connected to outcomes, explains why an organization's systems became the way they are.

The same long-term problem appears for individuals:

- An engineer has years of architecture judgments and production lessons.
- A teacher has a curriculum, explanations, and a method for helping learners.
- A consultant has frameworks, trade-offs, and examples from actual engagements.
- A researcher has hypotheses, revisions, evidence, and outcomes.

Today those insights are scattered across notes, code, conversations, courses, and temporary AI sessions. Publishing a static document or selling access to a chatbot does not preserve the evolution of the underlying expertise.

The opportunity is to let people **publish knowledge that continues to improve** and can earn revenue across years.

Comparable AI chat/builders validate the interaction pattern, but "projects + instructions + skills + chat + payments" is not a sufficient differentiator on its own. Afterglow should compete on **curation, provenance, version history, and compounding expertise**.

## Product thesis

A **Living Knowledge Product (LKP)** is a versioned, creator-controlled knowledge experience with:

1. **Expertise:** knowledge, principles, frameworks, and decisions the composer deliberately shares.
2. **Evidence:** traceable references and an explicit distinction between verified knowledge, opinion, and unknowns.
3. **Instructions and skills:** the ways that expertise is applied through an AI interface.
4. **Interactions:** private consumer sessions that use the published knowledge.
5. **Evolution:** feedback and new evidence can propose improvements; the composer reviews and publishes new versions.
6. **Economics:** access controls, pricing, usage limits, and creator earnings.

The consumer is buying access to a **living body of expertise**, not a claim to chat with the literal human or a complete imitation of their mind.

Working positioning:

> **Afterglow gives knowledge a memory, a way to evolve, and a way to earn.**

A stronger long-term promise:

> **Your experience shouldn't stop creating value when you stop working.**

This is an aspiration, not a promise of passive income. Distribution, usefulness, costs, and ongoing curation still determine whether a project is viable.

## Personas and core jobs

### Composer — creates and improves expertise

The composer can:

- Create a project with a name, domain, description, audience, and expectations.
- Set project-level instructions, boundaries, and allowed tools/skills.
- Add, edit, connect, and remove permitted source materials.
- Curate knowledge: principles, examples, decisions, rationale, alternatives, evidence, outcomes.
- Preview/test the project as a consumer.
- Publish a version; inspect change history and revert to a previous release if necessary.
- Set visibility, access rules, pricing, and usage allowance.
- Review aggregated usage signals and feedback candidates.
- Approve/reject suggested updates rather than allowing user conversations to rewrite knowledge automatically.
- Access the composer's own test chat history; access consumer-shared excerpts only where the consumer explicitly granted permission.

The composer **does not** automatically receive consumer conversations or private consumer memory.

### Consumer — uses expertise privately

The consumer can:

- Discover a project or follow a direct invitation link.
- See what expertise it offers, who authored it, and what evidence/limitations support it.
- Trial or subscribe, then interact through a simple chat UI.
- Maintain **their own** session history and personal context within that project.
- Optionally provide ratings, corrections, and explicitly shared conversations to help the composer.
- View applicable project version, usage allowance, and billing entitlement.
- Export/delete their own chat history subject to clearly disclosed retention obligations.
- Understand when a response is sourced from the creator's material versus general model reasoning.

The consumer pays for the usefulness of the expertise and experience, not access to another consumer's information.

## Proposed product surfaces

| Surface | Owns | Must not own |
| --- | --- | --- |
| **Composer Studio** | project configuration, knowledge curation, instructions, skills, publishing, pricing, feedback review | canonical chat sessions of every consumer |
| **Consumer Chat** | user sessions, personal context, runtime model/tool execution, consented feedback | editing published project knowledge without review |
| **Commerce** | entitlement, metering, subscription/credits, revenue accounting | deciding what is true |
| **Afterglow Memory Core** | durable knowledge interpretation, Decisions, Evidence, relationships, version/supersession, retrieval | payment processing, chat UI, user surveillance |

These are **logical responsibilities**, not a request to launch four services or microservices.

Initial UX concept:

```text
Composer
  -> create project
  -> curate knowledge / decisions / skills
  -> test privately
  -> publish v1
  -> set paid access
          |
          v
Consumer -> subscribe -> chat using published project snapshot
          |                        |
          |                        v
          |                 personal session memory
          v
optional feedback / consented excerpts
          |
          v
review queue -> composer approval -> publish v2
```

## Core boundary: durable knowledge != conversation history

Afterglow must preserve three different scopes:

| Scope | Owner | Visibility | Lifetime / mutation |
| --- | --- | --- | --- |
| **Published Project Knowledge** | Composer / authorized project collaborators | Consumers permitted by published access policy | Versioned; changed by explicit curation + publish |
| **Consumer Personal Context** | Consumer | Consumer; runtime only as needed for answering | Separate, manageable, deletable according to retention policy |
| **Feedback Candidates** | Consumer-provided or safely aggregated usage signals | Composer only with appropriate consent/aggregation | Provisional until review; never canonical by default |

**Do not silently promote consumer chat to project knowledge.**

Example:

```text
Consumer: "Redis always beats Postgres for this workload."
  -> chat reply; NOT a canonical fact
  -> perhaps feedback candidate when explicitly shared
  -> composer adds benchmark / evidence + reviews trade-offs
  -> publish a new knowledge item or Decision
```

An LLM-generated summary alone is not verification. A published claim should link to supporting evidence where available, carry its confidence/limitations, and preserve prior versions.

**Privacy default:** a composer sees aggregate metrics (usage, topic trends, satisfaction), not identifiable consumer prompts. Any excerpt-level sharing must be opt-in, purpose-limited, revocable where feasible, and visible to the consumer. Permission to use a source internally **does not** imply permission to redistribute its contents to paid consumers.

## Evolution loop: how knowledge compounds

The important loop is:

```text
Create / seed expertise
   -> publish version
   -> consumers interact
   -> outcomes + optional feedback
   -> candidate improvements
   -> composer checks sources, edits, approves
   -> publish next version
   -> measure whether answers actually improve
```

What can trigger an update?

- **Composer-initiated:** a new lesson, correction, instruction, skill, document, or intentional publication.
- **Evidence/event-driven:** a merged PR, incident resolution, measured outcome, or a relevant external artifact, when a connector exists.
- **Consumer feedback:** only a **candidate** suggestion, not an automatic memory write.
- **Periodic verification:** check existing claims/outcomes for staleness where there is a real evidence source; do not blindly summarize all sessions.

The original organizational event anchor — e.g. GitHub PR merged — remains the narrow first proof for company memory. For individual knowledge products, **explicit composer approval/publication** can be a legitimate publication event. It still must not magically turn an unsupported assertion into verified truth.

**Version semantics:**

- Consumers see a stable published project version for their conversation (pin a version per session when possible).
- Draft updates are private until published.
- A published Decision is not silently overwritten; new evidence may revise or supersede it.
- A changelog explains what improved and why; rollback should be possible.
- Project instructions and skills have versions just like knowledge content.

## Concrete example — Architecture Mentor

An experienced engineer publishes **Architecture Mentor**.

**v1** includes architecture decision frameworks, real anonymized examples, trade-off checklists, design principles, and incident lessons. A consumer asks how to migrate a live database and receives a grounded answer with assumptions and a source trail.

After 20 consumers use the product, aggregate metrics show recurring confusion around safe migrations. Some consumers opt in to share feedback. The composer reviews the gap, adds a migration playbook backed by evidence, tests the updated skill, and publishes **v2**.

The project is now better **because its expertise improved**, not because every chat was copied into a giant transcript database.

This can also work for education, research, consulting, and other domains, but start with one narrow domain where evidence and output quality can be reviewed.

## Distribution and monetization hypothesis

Start with creator-owned distribution: a composer shares a direct project link with an existing community or audience. **Do not build a broad marketplace before paid demand is demonstrated.**

Potential models:

- Subscription with included usage allowance.
- Credit packs for occasional usage.
- Free preview/trial and paid full access.

Choose **one simple model** for the initial pilot; avoid combinatorial plans and payouts logic before validated demand.

Unit economics must account for:

```text
consumer payment
  - payment processing / refunds / taxes where applicable
  - model inference + tool execution + retrieval costs
  - platform margin
  = creator earnings
```

An unlimited flat-rate chat product with expensive model/tool calls can lose money even when it has subscribers. Meter usage and set safe caps from day one. Show creators comprehensible **gross revenue, platform fees, model costs, and estimated net earnings**; make the eventual payout and tax obligations explicit before inviting the public.

## Architecture direction and current implementation

### Current code (as of 2026-10-18 review)

From `README.md`, `SERVICES.md`, `shared/src/types.ts`, and workspaces:

- `shared`, `ingest`, `observer`, and `health-monitor` exist.
- Current local durable store is `.data/memory.json`; GitHub connection secrets are stored separately.
- `observer` receives GitHub webhooks and stores events, people, components, and relationships.
- `ingest` handles intentional admin writes: instructions, seeds, maps, GitHub connection.
- Shared types **do not yet implement the intended Decision runtime**; the core proof is not complete.
- `mcp/` and `web/` are target surfaces, not implemented application workspaces yet.
- Admin ingest has no authentication and **must not** be made public as-is.
- One fork / deployment is designed for one organization, not a hosted multi-tenant marketplace.

Do not describe Composer Studio, Consumer Chat, multi-tenancy, billing, or a learning loop as already implemented.

### Proposed boundaries

Keep the prior decision from [Afterglow × Engineering Society](./26-09-14-afterglow-engineering-society-boundary.md):

**Afterglow remembers; an application interacts.**

```text
Product / application layer (future)
  Composer Studio | Consumer Chat | Commerce
                       |
                 memory read API / MCP
                       |
             Afterglow Memory Core
         Decision + Evidence + History
                       |
        ingest / observer / resolver
                       |
          GitHub / Docs / other sources
```

The product layer owns sessions, LLM orchestration, consumer identity, entitlements, and commerce. The memory core owns durable, evidence-backed expertise and its evolution. The product's deliberate curation/publishing actions need a controlled write interface (extending admin ingest/contracts where justified); consumer chat still never writes straight into canonical memory.

A hosted future may require project/tenant isolation, user authorization, key management, and a transactional store. **Do not add multi-tenant DB architecture, graph databases, queues, or extra services simply because this document envisions a platform.** Introduce them only when the next product proof requires them.

The current `Decision` primitive is strong for organizational architecture and expert choices, but **not every useful personal knowledge item is a Decision** (e.g., a lesson or reference principle). Test with real creator data before introducing a generic `KnowledgeItem` primitive. Retain provenance, versioning, and explicit status regardless of the eventual representation.

## First proof and sequencing

### Precondition — finish core memory proof

Preserve the existing first proof:

```text
instruction
 -> PR merged
 -> observer sees event
 -> resolver finds the correct evidence
 -> Decision stored
 -> MCP can explain why it exists
```

This grounds the product's distinctive value. An unrelated marketplace UI does not substitute for it.

### Pilot — one creator, one product, 10–20 consumers

Use a technical expertise project (such as **Architecture Mentor**) with evidence the creator has rights to share.

Minimal pilot scope:

1. Composer configures the project, instructions, curated knowledge, and optionally one useful skill.
2. Composer publishes `v1` and gets a shareable link.
3. Consumers use a simple chat UI with private per-user histories.
4. Access is gated by a simple paid entitlement or controlled paid pilot; capture real willingness to pay.
5. Model usage is metered and capped.
6. Consumers can opt into giving useful feedback; the composer reviews it and publishes `v2`.
7. Answers can cite the published knowledge/evidence and disclose unsupported claims.

Do **not** build: public discovery marketplace, rankings, social feeds, creator cloning, autonomous self-training, broad tool marketplace, complicated payout automation, cross-project consumer profiling, or a multi-agent society for this pilot.

### What success looks like

The smallest compelling proof:

```text
one expert publishes a knowledge product
 -> 10 consumers use it
 -> >=1 consumer pays for it
 -> a meaningful feedback signal is reviewed
 -> composer publishes an evidence-backed improvement
 -> consumers experience a demonstrably better answer
```

Track: paid conversion, repeat engagement (e.g. D7/D30), answer usefulness with grounded examples, creator effort per update, cost per successful session, and whether `v2` actually improves a representative question set.

Payment alone validates demand weakly; useful **repeat usage + improvement + workable unit economics** validate a living product.

## Alternatives considered

| Alternative | Why not first |
| --- | --- |
| Build a TypingMind-style general chatbot workspace | Competitive feature parity without differentiated knowledge quality |
| Clone an expert's voice/personality | Trust, misrepresentation, privacy risk; knowledge should not pretend to be a living human |
| Store and train on every consumer conversation | Pollutes truth, violates the privacy boundary, and encourages surveillance |
| Put chat runtime, marketplace, billing inside memory core | Conflicts with existing clean boundaries; increases complexity before core proof |
| Build a creator marketplace on day one | Two-sided cold-start problem before proving any creator can sell useful expertise |
| Keep knowledge static | Misses the central advantage: accumulated experience can evolve and compound |
| Create an independent knowledge store per app | Fragments the canonical memory and repeats the current problem |

## Risks and product guardrails

1. **Truth and provenance:** authored expertise may be opinion or unverified. Label limits and require evidence before making strong historical/technical claims.
2. **Privacy and ownership:** separate creator IP from consumer sessions; explicit consent for conversation sharing; control access to copyrighted/confidential evidence.
3. **Security:** project tools/skills need scoped permissions, safe execution, and protection against prompt injection; do not let consumer input rewrite instructions.
4. **Economics:** protect against inference abuse and unbounded usage.
5. **Trust and liability:** a project must disclose scope, limitations, source rights, and that it is AI-delivered expertise rather than the person themselves.
6. **Quality:** a growing knowledge store can still degrade. Maintain evaluation cases and version rollback.
7. **Product focus:** generic search and generic agent hosting are tempting diversions. A paid knowledge-evolution loop is the proof, not the number of features.

## Proposed decision record

- **Context:** Afterglow began as organizational memory; individuals may also have expertise worth preserving and sharing.
- **Decision (proposed):** Expand the long-term product vision to **Living Knowledge Products**, with composer/consumer commercialization in a layer above an evidence-based memory core.
- **Reasoning:** creator-controlled versioned expertise can compound, is reusable across LLM interfaces, and is more differentiated than chat UI features.
- **Alternatives:** generic chatbot marketplace, personality clone, transcript-based memory, monolithic AI platform — rejected for the initial thesis.
- **Consequences:** requires consent, publishing/version semantics, consumer isolation, metering/commerce, and eventually hosted identity; these must be phased rather than bundled into the current core MVP.
- **Evidence:** current repo [README](../README.md); [Engineering Society boundary](./26-09-14-afterglow-engineering-society-boundary.md); [Derived views proposal](./26-09-14-derived-memory-views-djao-integration.md); new proposed creator/consumer use case.
- **Would change if:** pilot users pay only for generic chatbot convenience, creators cannot feasibly curate/verify improvements, privacy boundaries are impossible to enforce, or the living-version loop fails to improve utility.

## Open questions (not blockers for this proposal)

- Does the first monetizable creator need a hosted project, or can a smaller isolated pilot prove demand?
- What is the minimal publishable knowledge contract beyond the current `Decision` concept?
- What precisely counts as a verified outcome for non-software expertise?
- Should paid consumer access be subscription-with-cap or prepaid credits in the first test?
- What retention/deletion promises can be supported by the first runtime and payment provider?
- If organizational memory and individual products share one core, which boundaries enforce legal ownership and tenant/project permissions?

## Bottom line

**Afterglow should not become a marketplace of prompts or digital replicas of people.**

It should become a place where people **publish living, evidence-aware expertise** that others can use, support financially, and help improve — with creator approval and consumer privacy.

The next milestone is **not a marketplace launch**. It is evidence that one creator can publish useful expertise, earn the first dollar, and make the product meaningfully better through a reviewed second version — while the underlying Afterglow memory core remains credible and independent.
