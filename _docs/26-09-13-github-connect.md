# GitHub connect on ingest

**Intent** — Admin connects a GitHub App from ingest; observer uses the same org connection to receive webhooks.

**What changes / what stays** — New ingest tab + `.data/github.json`. Webhook path stays `POST /hooks/github` on observer. `memory.json` still has no secrets. Instruction / seed / map unchanged.

**Decisions needed** — FYI only. User asked to implement so the flow can be tried locally.

## Share rule

Ingest writes the **org connection** (app id, PEM, webhook secret, smee URL, installation). Observer reads that file. Admin login session is not shared.

## Try path

1. Open ingest → GitHub tab.
2. Connect GitHub App (creates a smee channel if no public webhook URL).
3. Install the app on the dogfood repo.
4. Ping observer — signed with the stored secret — to prove the share without waiting for a real GitHub event.
