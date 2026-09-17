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
| **Observer** | `@afterglow-ai/observer` | NestJS | `3200` | `GET /health` | GitHub webhook → store · `GET /` events · `GET /overview` |
| **Health monitor** | `@afterglow-ai/health-monitor` | NestJS | `3201` | `GET /api/health` | Display-only CHM (`GET /` · `GET /api/overview` → observer) |
| **Ingest** | `@afterglow-ai/ingest` | NestJS | `3202` | `GET /health` | Admin gate: instruction, seed, map, GitHub App |
| **Shared** | `@afterglow-ai/shared` | TypeScript | — | — | Types + `memory.json` / `github.json` helpers |

Not built yet: `mcp/`, `web/`.

### Observer surfaces

| Method | Path | Role |
|--------|------|------|
| `GET` | `/` | Event timeline (HTML, newest first) |
| `GET` | `/events` | Hook list JSON |
| `POST` | `/hooks/github` | Webhook (GitHub or smee forward) |
| `GET` | `/overview` | Snapshot for CHM |
| `GET` | `/health` | Liveness |

On each accepted event observer writes `.data/memory.json` only: hook row, component (`repo.full_name`), employees (`sender` / PR / issue / release author), `works_on` (+ `authored` on `pull_request`). `installation*` also patches `.data/github.json`. No decision, no MCP, no backfill.

smee re-serializes JSON and breaks GitHub HMAC. Observer accepts that hop when the request is loopback and carries `x-afterglow-smee-proxy: 1`. Direct `POST /hooks/github` still requires a valid signature.

### Ingest surfaces

Admin UI: `GET /` → http://127.0.0.1:3202/ (local) · http://100.103.18.57:3202/ (NUC Tailscale)

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

NUC already has a copy of `.data/` (memory + GitHub connection). A fresh clone elsewhere starts empty — copy this directory, do not git it.

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

## Production (NUC) — live 2026-09-17

Host `djao@djao-prod` (same box as djao-trading / date-society). Tailscale **`100.103.18.57`**. Login from djao-trading: `yarn login:nuc` (`ssh -i _deploy/djao_nuc djao@djao-prod`).

Clone: `~/prod/afterglow-ai` (`/home/djao/prod/afterglow-ai`). Host-only `.env` + `.data/` (not in git). `yarn deploy:*` is **not** in this repo yet — pull then restart PM2 by hand.

```bash
# after push to origin/main
ssh -i _deploy/djao_nuc djao@djao-prod
source ~/.nvm/nvm.sh
cd ~/prod/afterglow-ai
git fetch origin && git reset --hard origin/main
yarn install --frozen-lockfile
yarn workspace @afterglow-ai/shared build
yarn workspace @afterglow-ai/observer build
yarn workspace @afterglow-ai/ingest build
yarn workspace @afterglow-ai/health-monitor build
pm2 restart afterglow-observer afterglow-health afterglow-ingest
```

Do not run laptop `yarn dev:observer` at the same time (duplicate smee writes).

### NUC ports

Processes bind `*:3200–3202`. Reach them on Tailscale; do not publish ingest on the public internet.

| Port | PM2 | Package script | Liveness | UI / API |
|------|-----|----------------|----------|----------|
| `3200` | `afterglow-observer` | `observer/dist/main.js` | http://100.103.18.57:3200/health | http://100.103.18.57:3200/ · `GET /events` · `GET /overview` · `POST /hooks/github` (smee only) |
| `3201` | `afterglow-health` | `health-monitor/dist/main.js` | http://100.103.18.57:3201/api/health | http://100.103.18.57:3201/ · `GET /api/overview` |
| `3202` | `afterglow-ingest` | `ingest/dist/main.js` | http://100.103.18.57:3202/health | http://100.103.18.57:3202/ (admin, no auth) |

On-box probes use `127.0.0.1` and the same paths. `OBSERVER_URL=http://127.0.0.1:3200` in host `.env`.

cwd for all three: `/home/djao/prod/afterglow-ai`. `AFTERGLOW_DATA_DIR=.data` (repo-root `.data`).

### GitHub → NUC — smee (decided)

GitHub cannot call a Tailscale IP. Do **not** point the App webhook at `http://100.103.18.57:3200/hooks/github`.

**Keep the current smee.io channel.** GitHub stays aimed at that URL. NUC observer subscribes via `.data/github.json` (`webhookProxy` + smee URL). Leave `AFTERGLOW_WEBHOOK_URL` empty. Do not change the App webhook URL.

One **live** smee subscriber: NUC `afterglow-observer` only.

`INGEST_PUBLIC_URL` only matters if you recreate the App. Tunnel / ngrok is out of scope unless we drop smee later.

## Port map (quick)

| Port | Where | Service |
|------|-------|---------|
| `3200` | local dev · **NUC** | observer |
| `3201` | local dev · **NUC** | health-monitor |
| `3202` | local dev · **NUC** (Tailscale / no public ingest) | ingest |
| `4321` | — | `web/` not built |
| Pages | public | https://tam-pham-alpha.github.io/afterglow-ai/ — landing only, not the store |

## Boundaries

- One fork / one deploy = one org. Do not add `_docs/{org}/` or put company memory in git.
- GitHub App is the bell. Observer writes the store. Ingest is the only admin write path.
- CHM is display-only. It does not write memory.
- Never commit `.data/github.json`, `.pem`, or `.env`.
- Ingest is an admin gate with no login — keep it off the public internet.
