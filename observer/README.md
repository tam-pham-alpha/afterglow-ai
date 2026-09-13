# observer

GitHub is the bell. This process receives webhooks, writes people / components / relationships into the store, and exposes `/overview` for the CHM card.

Cron backfill is not in this slice.

## Run

```bash
yarn workspace @afterglow-ai/shared build
yarn workspace @afterglow-ai/observer dev
```

- `POST /hooks/github` — GitHub webhook
- `GET /overview` — snapshot for CHM
- `GET /health`

Default port `3200`. Point a GitHub App or repo webhook at `http://<host>:3200/hooks/github`.

If `GITHUB_WEBHOOK_SECRET` is set, `X-Hub-Signature-256` is required. If empty, signatures are skipped (local only).

Store: `$AFTERGLOW_DATA_DIR/memory.json` (default `.data/memory.json`). Docs stay `0` until ingest writes counts.
