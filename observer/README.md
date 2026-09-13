# observer

GitHub is the bell. This process receives webhooks, writes people / components / relationships into the store, and exposes `/overview` plus `/summary` for the CHM card.

Cron backfill is not in this slice.

## Run

```bash
yarn workspace @afterglow-ai/shared build
yarn workspace @afterglow-ai/observer dev
```

- `POST /hooks/github` — GitHub webhook
- `GET /overview` — snapshot for CHM
- `GET /summary` — evidence-only prose of what the store currently remembers
- `GET /health`

Default port `3200`. Point a GitHub App or repo webhook at `http://<host>:3200/hooks/github`.

Webhook secret: `GITHUB_WEBHOOK_SECRET` if set, otherwise `.data/github.json` written by ingest Connect. If both empty, signatures are skipped (local only).

If that file has a smee.io webhook URL, observer subscribes and forwards to `POST /hooks/github`.

Store: `$AFTERGLOW_DATA_DIR/memory.json` (default repo-root `.data/memory.json`). Docs stay `0` until ingest writes counts.
