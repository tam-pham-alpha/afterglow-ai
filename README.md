# AfterglowAI

Công ty không thiếu dữ liệu. Công ty thiếu trí nhớ.

Afterglow là ánh sáng còn lại sau khi nguồn sáng đã đi qua. AfterglowAI không giữ lại con người. Nó làm những dấu vết họ để lại — code, quyết định, incident, design — đủ rõ để người đến sau còn hiểu được.

Thesis đầy đủ: [AfterglowAI, khi công ty bắt đầu có trí nhớ](https://github.com/tam-pham-alpha/xaolonist.eth/pull/18).

Landing: [tam-pham-alpha.github.io/afterglow-ai](https://tam-pham-alpha.github.io/afterglow-ai/).

## Vấn đề

GitHub, Slack, Jira, Notion, Grafana đều đầy. Chúng đứng cạnh nhau nhưng không biết nhau.

Một pull request có thể là kết quả của một incident. Incident ấy bắt đầu từ Slack. Slack nhắc một thiết kế cũ trên Notion. Thiết kế được viết bởi người đã chuyển team. Sáu tháng sau, engineer mới chỉ thấy đoạn code cuối cùng.

Tài liệu truyền thống thất bại vì càng bận càng ít viết, và hệ thống cần docs nhất lại đổi nhanh nhất. Afterglow đi ngược: không bắt người tạo knowledge. Nó quan sát artifact vốn đã được tạo ra, rồi nối quan hệ giữa chúng. Knowledge là sản phẩm phụ của công việc hàng ngày.

## Không phải

- Search engine cho document
- Kho transcript cho conversation
- Folder docs trong git để tổ chức fork rồi điền vào
- Employee monitoring, chấm điểm, hay đọc mọi prompt
- Digital employee hoàn chỉnh — đó là câu chuyện rất xa

## Kiến trúc

GitHub là neo sự kiện, không phải kho dữ liệu lớn nhất. Merge, issue đóng, release, deploy = tín hiệu tổ chức vừa thật sự đổi. Slack / Jira / Notion chứa nhiều ý tưởng chưa làm, ticket chết, design hết hạn. Từ tiếng chuông đó, agent mới lần câu chuyện.

Một tổ chức **fork repo này**, deploy instance của họ, rồi nạp instruction + knowledge qua **ingest** — không đổ tài liệu vào git.

```text
Fork / deploy (một org)
     ↓
ingest ← instruction, seed, map
     ↓              ↖ Notion / Google Docs / … (MCP)
Company memory (store)
     ↑
observer ← GitHub event
     ↓
Context resolver → MCP nguồn
     ↓
Decision
     ↓
Afterglow MCP / web  →  Cursor, Claude, người
```

**Ingest.** Cổng admin — instruction, seed, map, và Connect GitHub App. Mọi ghi do người chủ động đưa vào đi qua đây. Webhook không. MCP không. Chi tiết: [`ingest/README.md`](ingest/README.md).

**MCP vào.** Không tự viết connector. Afterglow hỏi GitHub, Notion, Slack, Jira, Docs khi cần. Không ingest cả kho.

**MCP ra.** Cùng chuẩn: một bên học, một bên nhớ.

**Observer.** GitHub vẫn là neo sự kiện *sau khi* đã có instruction. Ingest không thay observer.

## Bản đồ khởi đầu

Một fork / một deploy = một tổ chức. Không có cây `_docs/{org}/`. Bản đồ khởi đầu nạp qua ingest:

| Entity      | Điểm tựa ban đầu                                      |
| ----------- | ----------------------------------------------------- |
| Instruction | cách resolver hiểu org này                            |
| Service     | repository nào thuộc về nó                            |
| Employee    | đang phụ trách hoặc thường xuyên làm việc với service |
| Document    | mô tả service hoặc chủ đề nào                         |

Graph tự dày theo thời gian:

```text
Employee ──works_on──────▶ Service
Employee ──authored──────▶ Pull Request
Employee ──made──────────▶ Decision

Pull Request ──changes───▶ Service
Pull Request ──implements▶ Decision

Incident ──affects───────▶ Service
Incident ──resolved_by───▶ Pull Request

Decision ──supported_by──▶ Document
Decision ──supersedes────▶ Decision
```

Employee không chỉ là một dòng org chart. Service không chỉ là một repository. Document không còn đứng riêng. Giá trị nằm ở đường nối.

## Decision là đơn vị tri thức

Nếu chỉ lưu document, Afterglow thành search engine khác. Nếu chỉ lưu conversation, nó thành kho transcript. Đơn vị đáng giữ là **decision**.

Một decision trả lời:

- vấn đề ban đầu là gì
- giả thuyết nào đã thử, phương án nào bị loại
- ai tham gia
- bằng chứng nào khiến team đổi hướng
- PR nào hiện thực hóa
- sau deploy, hệ thống có tốt hơn không

Mỗi kết luận phải lần ngược được nguồn. Knowledge là lớp diễn giải trên bằng chứng thật, không phải lời kể của AI.

Decision **không bị ghi đè**. Decision mới `supersede` decision cũ. Hỏi “sao đang làm vậy” → trạng thái hiện tại. Hỏi “trước đã khác chưa” → đi ngược thời gian.

Khi graph đủ dày, các lớp khác gần như tự xuất hiện:

- **Incident knowledge** — gom symptom, nguyên nhân, PR sửa, outcome; sự cố mới tìm sự cố cũ theo cấu trúc, không chỉ keyword
- **Design knowledge** — README + design intent + implementation thật + lịch sử lệch thiết kế

## Digital counterpart

Làm đủ lâu, mỗi người để lại một decision history: service nào, incident loại gì, hay kiểm tra gì trước, quyết định nào sống lâu trên production.

Đây là bản đồ năng lực từ việc thật — không phải hồ sơ nhân sự. Counterpart không giả vờ “suy nghĩ giống một người”. Nó nói: trước đây người đó chọn A thay B vì lý do nào, incident nào dẫn tới, implementation nằm ở đâu.

Bảo tồn phần năng lực đã thể hiện. Không sao chép con người.

## Ranh giới: trí nhớ, không giám sát

Chỉ quan sát **work artifacts** — những thứ vốn đã thuộc vận hành của tổ chức:

- pull request, issue, deployment
- design document, incident

Agent chỉ lần thêm context khi một thay đổi thật sự đã xảy ra. Knowledge phải có bằng chứng. Quyền truy cập kế thừa hệ thống nguồn. Phần riêng tư không liên quan đến công việc không vào graph.

Không đọc mọi prompt. Không lưu mọi cuộc trò chuyện. Không đo một người đã làm bao nhiêu việc mỗi ngày. Nếu mục tiêu trượt sang đó, nhân viên sẽ muốn tránh sản phẩm — và hệ thống thu về noise thay vì hiểu thêm.

## MVP

Phiên bản đầu không cần hạ tầng cầu kỳ. Thách thức khó nhất không phải lưu một triệu cạnh. Nó là agent có đủ chính xác để nhìn một PR, tìm đúng context, và phân biệt quyết định thật với trao đổi thoáng qua.

| Mảnh              | Vai trò                                          |
| ----------------- | ------------------------------------------------ |
| ingest            | instruction + seed + map + GitHub App connect    |
| GitHub App        | observer — nhận webhook; secret từ ingest        |
| Job queue         | ingest job + GitHub event                        |
| Context resolver  | đọc instruction, rồi lần nguồn qua MCP           |
| PostgreSQL        | entity, relationship, decision, event, instruction versions |
| pgvector          | semantic retrieval                               |
| Object storage    | raw evidence                                     |
| Afterglow MCP     | expose company memory ra ngoài                   |

Graph database để sau. Nếu resolver chưa đúng, Neo4j cũng không cứu được sản phẩm.

Afterglow MCP không expose ingest và không chỉ search document. Một instance = một org; `org` trên tool để dành hosted sau. Câu hỏi kiểu người trong công ty đặt:

```text
who_knows(topic)
why_decision(decision_or_service)
similar_incidents(symptoms)
service_history(service)
employee_context(employee, topic)
what_changed(service, since)
```

## First proof

Đưa Afterglow một pull request vừa merge. Hệ thống phải tự:

1. nhận ra service liên quan
2. tìm đúng ticket và document
3. lần ra incident nếu có
4. hiểu những phương án đã được cân nhắc
5. ghi một decision vào store mà senior tham gia sự việc đọc xong phải thấy: đúng, đây là lý do chúng ta đã làm như vậy

First proof: fork/deploy dogfood → nạp instruction qua ingest → một PR merge trên chính repo này.

Nếu làm được việc ấy ổn định, mỗi PR để lại thêm một chút ánh sáng. Sau một năm có decision history. Sau vài năm, service có lịch sử sống, incident cũ giúp incident mới, năng lực của từng người để lại hình dạng rõ hơn.

Rồi một ngày ai đó rời đi. Khi người mới hỏi vì sao hệ thống được xây như vậy, công ty vẫn còn một nơi để lần dấu chân cũ.

## Monorepo

Yarn workspaces + Turborepo, hình gần date-society: vài process + `shared`, không copy rừng deploy của djao-trading.

```text
afterglow-ai/
  shared/              # types + contracts
  ingest/              # admin gate — instruction, seed, map
  observer/            # GitHub webhook → store + /overview
  health-monitor/      # one display-only overview card
  mcp/                 # Afterglow MCP (outbound)
  web/                 # admin ingest + đọc trí nhớ
  docs/                # landing — GitHub Pages
  _docs/               # log / plan của developer upstream — không phải memory
```

| Workspace / folder | Vai trò |
| --- | --- |
| `shared` | `Instruction`, `Service`, `Employee`, `Decision`, `Event`, `Seed`. Mọi process import `@afterglow-ai/shared` |
| `ingest` | Cổng admin. Instruction / seed / map / GitHub connect. Port `3202`. [`ingest/README.md`](ingest/README.md) |
| `observer` | Webhook là đường chính (`POST /hooks/github`). Cron backfill chưa có. Port `3200`. [`observer/README.md`](observer/README.md) |
| `mcp` | Afterglow MCP — stdio cho Cursor. Hỏi store, không nhận upload |
| `web` | UI sau này. Mọi ghi admin vẫn gọi ingest, không ghi thẳng store |
| `docs/` | Landing tĩnh, GitHub Pages. Không phải trí nhớ tổ chức |
| `_docs/` | Log developer khi xây nền tảng: plan, ADR, note debug. Fork không dùng làm trí nhớ. [`_docs/README.md`](_docs/README.md) |
| `health-monitor` | Một card display-only: hooks, employees, components, employee↔component, docs theo component. Port `3201` |

Watched repos là config của instance (universe / map), không phải package. Không nhét code khách vào monorepo. Không có `knowledge/` trong git.

Không tạo `cron/` hay `resolver/` riêng ngày 1. Tách `resolver/` khi agent loop đủ nặng.

## Trạng thái

`shared` + `observer` + `ingest` + một card CHM display-only. MCP / web chưa có.

```bash
yarn install
yarn workspace @afterglow-ai/shared build
yarn dev:observer   # :3200
yarn dev:health     # :3201
yarn dev:ingest     # :3202 — admin gate
```

Thứ tự chứng minh: **nạp instruction** → một PR merge → decision trong store → `mcp` trả `why_decision` → `web` đọc cùng record → fork thứ hai.

Org khác = fork / deploy khác, không thêm folder.
