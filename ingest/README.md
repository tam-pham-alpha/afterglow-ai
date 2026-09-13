# ingest

Cổng **admin**. Mọi thay đổi do người cố ý đưa vào hệ thống đi qua đây: instruction, seed, map.

Không phải mọi giao tiếp.

| Ai | Đi đâu | Không phải ingest |
| --- | --- | --- |
| Admin / web form | ingest | — |
| GitHub webhook | observer | event, không phải người nạp |
| Cursor / Claude / agent | Afterglow MCP | hỏi trí nhớ, không ghi |
| CHM card | `GET /overview` trên observer | display-only |

Web sau này chỉ là UI. Write API vẫn là ingest.

## Nhận gì

| Loại | Việc |
| --- | --- |
| **Instruction** | Cách hiểu org. Versioned. Seed không ghi đè. |
| **Seed** | ADR / postmortem / URL. Luôn có evidence. Connector job = `pending`, chưa kéo Notion thật. |
| **Map** | Employee, component, document, watched repo. |

## Bề mặt

```text
PUT/GET  /instructions
POST     /seeds
POST     /seeds/from-connector
GET      /seeds
GET      /seeds/:id
PUT/GET  /map
GET      /health
GET      /                 admin page
```

```bash
yarn workspace @afterglow-ai/shared build
yarn workspace @afterglow-ai/ingest dev
```

Port `3202` — http://127.0.0.1:3202/

Cùng file store với observer: `$AFTERGLOW_DATA_DIR/memory.json`.
