# Memory summary

**Intent** — Ask Afterglow what it currently remembers. The answer must come from instruction, seed, map, and GitHub events already in the store.

**What changes / what stays** — New `GET /summary` on observer and ingest. CHM card and the ingest Summary tab render it. No LLM. No decision records. Webhook path and write gate stay the same.

**Decisions needed** — FYI only. Summary is a read. First proof still requires a merged PR written as a decision.
