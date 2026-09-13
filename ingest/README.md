# ingest

Service để một tổ chức **nạp instruction và knowledge ban đầu** vào instance Afterglow của họ.

Không phải folder docs trong git. Fork repo → deploy → gọi ingest. Observer (GitHub) chạy sau khi đã có điểm tựa.

## Nhận gì

Ba thứ, tách rõ:

| Loại | Ai viết | Sống ở đâu | Việc |
| --- | --- | --- | --- |
| **Instruction** | Người / admin | Store, versioned | Cách Afterglow hiểu org này: tên service, alias người, nguồn nào được hỏi, nguồn nào cấm, ngôn ngữ, ranh giới riêng tư |
| **Seed knowledge** | Người upload, hoặc kéo từ Notion / Google Docs / … | Store + evidence | ADR, postmortem, design đã có — thành document / decision *có nguồn*, không phải wiki trong repo |
| **Map** | Người hoặc suy ra từ seed | Store | Service ↔ repo, employee ↔ handle, document ↔ chủ đề |

Instruction không phải knowledge. Resolver đọc instruction *trước* khi lần một PR. Seed không ghi đè instruction.

## Không nhận

- Cả Slack, cả Drive “cho chắc”
- Prompt cá nhân, chat riêng, dữ liệu HR
- Code của repo khách (watched repo nằm ở config / universe, không ingest thành file trong monorepo)

## Nguồn

1. **Upload / paste** — file, markdown, URL công ty tự đưa
2. **Connector** — Notion, Google Docs, Confluence… qua MCP đã có. Ingest tạo job “kéo các trang này”, không tự viết connector
3. **GitHub** — không thuộc ingest. Đó là `observer` (event). Ingest có thể nhận *danh sách repo cần watch* như một phần map

Org thường bắt đầu bằng instruction + vài document gốc, rồi bật observer.

## Bề mặt (v0)

```text
PUT  /instructions          thay instruction hiện tại (giữ version cũ)
GET  /instructions          instruction đang hiệu lực
POST /seeds                 upload / paste / URL
POST /seeds/from-connector  job kéo Notion / Google Docs / …
GET  /seeds/:id             trạng thái + document đã tạo
PUT  /map                   service / employee / document bootstrap
GET  /map
```

Web admin gọi các API này. MCP **không** expose ingest — MCP chỉ hỏi trí nhớ đã có.

Mỗi seed phải giữ evidence (file id, URL, page id). Decision sinh từ seed vẫn phải lần ngược được.

## Instruction mẫu (ý, không phải schema cuối)

- Service nào map repo nào
- Handle GitHub / email ↔ người
- “Không đọc Slack DMs / channel #random”
- “Ticket prefix PAY- thuộc payments”
- Ngôn ngữ trả lời, mức độ suy diễn (chỉ kết luận khi có evidence)

## Vị trí trong monorepo

Workspace `@afterglow-ai/ingest`. Chia store với observer / mcp / web qua `@afterglow-ai/shared`. Một fork = một deployment = một org; ingest không nhận `org` trên URL ngày 1. Hosted multi-tenant để sau — lúc đó thêm `org` vào contract, không đổi ý nghĩa instruction vs seed.
