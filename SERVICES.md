# AfterglowAI — Services

Ports, processes, and host facts for local and NUC. Update this file when a service or port changes.

Product: [README.md](./README.md) · Ingest: [ingest/README.md](ingest/README.md) · Observer: [observer/README.md](observer/README.md)

Do **not** commit secrets. PEM, webhook secret, and `.data/github.json` stay on the machine. See [`.env.example`](./.env.example).

## Local env

| Variable | Default | Used by | Notes |
|----------|---------|---------|-------|
| `OBSERVER_PORT` | `3200` | observer | |
| `HEALTH_PORT` | `3201` | health-monitor | |
| `INGEST_PORT` | `3202` | ingest | |
| `OBSERVER_URL` | `http://127.0.0.1:3200` | ingest ping, health-monitor | Observer base URL |
| `INGEST_PUBLIC_URL` | `http://127.0.0.1:3202` | ingest GitHub App callback / setup | Must be the URL GitHub can open in a browser |
| `AFTERGLOW_WEBHOOK_URL` | empty | ingest Connect | Public webhook. Empty → reuse stored smee or create one |
| `GITHUB_WEBHOOK_SECRET` | empty | observer | Override. Else observer reads `.data/github.json` |
| `AFTERGLOW_DATA_DIR` | `.data` | ingest + observer | Relative path is always repo root |
| `AFTERGLOW_APP_HOMEPAGE` | afterglow-ai GitHub URL | ingest manifest | Optional |

```bash
yarn install
yarn workspace @afterglow-ai/shared build
yarn dev:observer   # :3200
yarn dev:health     # :3201
yarn dev:ingest     # :3202
```

Build `shared` after any change under `shared/`. Observer and ingest load `shared/dist/`.

## Application packages

| Service | Package | Stack | Port | Health | Role |
|---------|---------|-------|------|--------|------|
| **Observer** | `@afterglow-ai/observer` | NestJS | `3200` | `GET /health` | GitHub webhook → store · `GET /overview` |
| **Health monitor** | `@afterglow-ai/health-monitor` | NestJS | `3201` | `GET /health` | Display-only CHM card (`GET /api/overview` → observer) |
| **Ingest** | `@afterglow-ai/ingest` | NestJS | `3202` | `GET /health` | Admin gate: instruction, seed, map, GitHub App |
| **Shared** | `@afterglow-ai/shared` | TypeScript | — | — | Types + `memory.json` / `github.json` helpers |

Not built yet: `mcp/`, `web/`.

### Observer surfaces

| Method | Path | Role |
|--------|------|------|
| `POST` | `/hooks/github` | Webhook (GitHub or smee forward) |
| `GET` | `/overview` | Snapshot for CHM |
| `GET` | `/health` | Liveness |

On each accepted event observer writes `.data/memory.json` only: hook row, component (`repo.full_name`), employees (`sender` / PR / issue / release author), `works_on` (+ `authored` on `pull_request`). `installation*` also patches `.data/github.json`. No decision, no MCP, no backfill.

smee re-serializes JSON and breaks GitHub HMAC. Observer accepts that hop when the request is loopback and carries `x-afterglow-smee-proxy: 1`. Direct `POST /hooks/github` still requires a valid signature.

### Ingest surfaces

Admin UI: `GET /` → http://127.0.0.1:3202/

`PUT/GET /instructions` · `POST/GET /seeds` · `PUT/GET /map` · `GET/POST/DELETE /github` · Connect / callback / ping / refresh-install.

**Ingest has no auth.** Do not publish `:3202` on the public internet.

## Data on disk (gitignored)

Same directory for ingest and observer. Default: repo-root `.data/`.

| File | What | Secrets? |
|------|------|----------|
| `.data/memory.json` | Hooks, employees, components, relationships, instruction, seeds, map | No (org knowledge) |
| `.data/github.json` | App id, slug, webhook URL, webhook secret, PEM | **Yes** |
| `*.pem` | GitHub App private key download | **Yes** — never commit |

`.gitignore` covers `.env`, `.data`, `*.pem`.

Copy `.data/` onto NUC (or recreate via ingest). A fresh clone has empty memory.

## GitHub App (this instance)

One App per Afterglow deploy. Install it on the repos this instance should hear.

| Item | Value |
|------|--------|
| **Name** | Afterglow-djao-trading |
| **Slug** | `afterglow-djao-trading` |
| **App ID** | `49765600` |
| **Owner** | `@tam-pham-alpha` |
| **Settings** | https://github.com/settings/apps/afterglow-djao-trading |
| **Install** | https://github.com/apps/afterglow-djao-trading/installations/new |
| **Permissions** | contents, metadata, pull requests, issues — read |
| **Events** | `push`, `pull_request`, `issues`, `issue_comment`, `release` |

Webhook secret and PEM live only in `.data/github.json` (and the downloaded `.pem`). Do not paste them here.

Local webhook uses a **smee.io** channel stored on that file. smee is a capability URL — treat it like a secret; anyone who has it can inject events.

## Production (NUC) — not provisioned yet

Intended host: `djao@djao-prod` (same box as djao-trading / date-society). Tailscale **`100.103.18.57`** (djao NUC). Confirm `hostname` / IP before bind.

Proposed clone: `~/prod/afterglow-ai`. Deploy = `git pull` `origin/main` on that clone, then restart processes. **Push before pull.** Host-only `.env` and `.data/` after pull.

`yarn deploy:*` / PM2 names are **not in this repo yet**.

### Proposed NUC ports

Local ports `3200–3202` are unused on the djao NUC inventory. Keep them unless a bind fails.

| Port | Service | Bind |
|------|---------|------|
| `3200` | observer | Tailscale / localhost — **not** a GitHub target by itself |
| `3201` | health-monitor | Tailscale OK (`GET http://100.103.18.57:3201/`) |
| `3202` | ingest | **localhost or Tailscale only** — no public bind |

### GitHub → NUC (gotcha)

GitHub cannot call a Tailscale IP. `http://100.103.18.57:3200/hooks/github` will not receive webhooks.

Pick one public path and set it as the App webhook URL (and `AFTERGLOW_WEBHOOK_URL`):

| Option | When |
|--------|------|
| Keep smee.io, observer subscribes on NUC | Fastest first deploy; smee stays the public face |
| Cloudflare Tunnel (or similar) → `127.0.0.1:3200/hooks/github` | Prefer for anything past dogfood |
| ngrok / other HTTPS proxy | Temporary |

`INGEST_PUBLIC_URL` only matters if you recreate the App (callback/setup). The current App is already registered.

After moving webhook off laptop smee: update the App hook URL, keep the **same** webhook secret as `.data/github.json`, restart observer.

### Proposed PM2 names

| Process | cwd | Script |
|---------|-----|--------|
| `afterglow-observer` | clone root | `yarn workspace @afterglow-ai/observer start:prod` (after `yarn build`) |
| `afterglow-health` | clone root | `yarn workspace @afterglow-ai/health-monitor start:prod` |
| `afterglow-ingest` | clone root | `yarn workspace @afterglow-ai/ingest start:prod` |

`AFTERGLOW_DATA_DIR` must be the same absolute path for all three.

## Port map (quick)

| Port | Where | Service |
|------|-------|---------|
| `3200` | local · NUC (planned) | observer |
| `3201` | local · NUC (planned) | health-monitor |
| `3202` | local · NUC localhost/Tailscale (planned) | ingest |
| `4321` | — | `web/` not built |
| Pages | public | https://tam-pham-alpha.github.io/afterglow-ai/ — landing only, not the store |

## Boundaries

- One fork / one deploy = one org. Do not add `_docs/{org}/` or put company memory in git.
- GitHub App is the bell. Observer writes the store. Ingest is the only admin write path.
- CHM is display-only. It does not write memory.
- Never commit `.data/github.json`, `.pem`, or `.env`.
- Ingest is an admin gate with no login — keep it off the public internet.
