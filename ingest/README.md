# ingest

Cổng **admin**. Mọi thay đổi do người cố ý đưa vào hệ thống đi qua đây: instruction, seed, map, và kết nối GitHub App.

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
| **GitHub** | Tạo / cài GitHub App. Secret nằm ở `.data/github.json`, observer đọc cùng file. |

## Bề mặt

```text
PUT/GET  /instructions
POST     /seeds
POST     /seeds/from-connector
GET      /seeds
GET      /seeds/:id
PUT/GET  /map
GET/POST/DELETE /github
POST     /github/start
GET      /github/callback
POST     /github/manual
POST     /github/ping
POST     /github/refresh-install
GET      /health
GET      /                 admin page
```

```bash
yarn workspace @afterglow-ai/shared build
yarn workspace @afterglow-ai/ingest dev
```

Port `3202` — http://127.0.0.1:3202/

Cùng store với observer: `$AFTERGLOW_DATA_DIR/memory.json`. Kết nối GitHub: `$AFTERGLOW_DATA_DIR/github.json` — không phải trí nhớ.
