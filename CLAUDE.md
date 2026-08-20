# CLAUDE.md

File này hướng dẫn Claude Code (claude.ai/code) khi làm việc với repo này.

## Dự án này là gì

Hệ thống quản lý nhà trọ, xây theo SRS trong
`Yeu_Cau_Phan_Mem_Quan_Ly_Phong_Tro_V2.md`. Một lần deploy phục vụ hai nhóm người
dùng: trang chủ công khai để quảng cáo phòng và nhận liên hệ, và một CMS để chủ trọ
quản lý phòng, hợp đồng, chỉ số điện nước hằng tháng, và hóa đơn. Khách thuê có cổng
thông tin riêng, chỉ đọc.

**Giao diện bằng tiếng Việt.** Mọi chuỗi người dùng nhìn thấy nằm trong
`frontend/src/constants/strings.ts`, còn thông báo của API nằm trong
`app/core/messages.py`.

## Tổng quan kiến trúc

Hai ứng dụng và một cơ sở dữ liệu:

- `backend/` — FastAPI, Python 3.11, uvicorn ở **:8000**
- `frontend/` — React 19 + TypeScript, dev server Vite 8 ở **:5173**
- MongoDB 7, chạy từ `docker-compose.yml` ở **:27017**

Hai app nối với nhau bằng proxy, không phải CORS — xem rule `api-contract` bên dưới.

- Backend: route `api/v1/` (mỏng) → logic nghiệp vụ `services/` → model Pydantic
  `schemas/`, với `common/` và `core/` giữ các phần dùng chung.
- Frontend: atomic design, `components/atoms` → `molecules` → `organisms` →
  `templates` → `pages`, state là các slice Redux Toolkit trong `src/store/slices/`.
  Animation của trang chủ nằm ở `src/hooks/` (`useInView` dựa trên IntersectionObserver,
  `useCountUp`) cộng helper `stagger()` trong `src/utils/style.ts` — không phải thư viện
  animation nào. jsdom không có IntersectionObserver nên `src/test/setup.ts` stub sẵn nó.

## Skills

Ba skill trong `.claude/skills/` chứa quy trình chi tiết từng bước. Nạp skill phù hợp
trước khi viết code:

- **`backend-endpoint`** — mọi route, schema, service, hoặc lỗi API của FastAPI.
- **`frontend-feature`** — mọi component, page, Redux slice, hoặc text hiển thị.
- **`frontend-design`** — mọi việc liên quan hình ảnh: bảng màu, chữ, bố cục, màn hình mới.

## Agents

Ba subagent trong `.claude/agents/`, đều chạy Opus. Giao việc cho chúng thay vì tự
làm trong context chính — tool output của subagent không đổ vào context chính, chỉ báo
cáo cuối cùng mới quay về.

| Agent | Giao khi nào | Tool |
|---|---|---|
| `researcher` | Câu hỏi phải quét nhiều file: luồng dữ liệu, code nằm ở đâu, đánh giá tác động trước khi sửa | Chỉ đọc |
| `testing` | Viết / chạy / sửa test, `make check`, xử lý lỗi lint và typecheck | Đọc + sửa file + chạy lệnh |
| `code-reviewer` | Soát một diff trước khi commit hoặc push: lỗi đúng/sai, vi phạm rule, lỗ bảo mật | Chỉ đọc |

`researcher` chạy theo quy trình 5 bước và trả báo cáo dưới 400 từ theo khuôn cố định.
`testing` nuốt phần output ồn của pytest/vitest và chỉ trả về kết quả cùng danh sách
thay đổi. `code-reviewer` chỉ nhìn phần diff đổi, xếp phát hiện theo ba mức
Chặn / Nên sửa / Gợi ý, và không tự sửa gì — nó mô tả, người khác quyết định.

Không giao cho `researcher` khi đã biết chính xác file cần sửa — lúc đó đọc thẳng
nhanh hơn.

## Rules

Các ràng buộc cố định nằm trong `.claude/rules/` và được import bên dưới, nên chúng
luôn có trong context. Skill nói *cách* xây một thứ; rule nói cái gì **không được phá**
trong lúc xây.

| Rule | Nội dung |
|---|---|
| `no-hardcoded-strings` | Ràng buộc định hình cả dự án — mọi thứ nằm trong module hằng số, cả hai phía |
| `api-contract` | Tiền tố `/api/v1`, envelope phản hồi, dùng `AppError` chứ không phải `HTTPException` |
| `backend-layers` | Ranh giới các tầng, helper trong `common/`, Pydantic + phân trang, kiểu chặt |
| `mongodb-access` | Gọi `get_collection()` lúc chạy, dùng hằng `Collection`/`Field` |
| `frontend-architecture` | Các tầng atomic, ai được chạm vào Redux, routing, ràng buộc TS |
| `async-ui-state` | Chống double-click trên mọi control có gửi request |
| `auth-and-roles` | `UserRole`, bốn dependency phân quyền route, và `CronDep` cho scheduler |
| `domain-invariants` | Hành vi nghiệp vụ của hợp đồng, xác thực email, chỉ số, hóa đơn |
| `design-system` | Một file CSS duy nhất, bảng màu cố định, `--font-mono` cho mọi con số |
| `testing` | Helper dựng fixture và cách ly database của bộ test backend |
| `secrets-from-env` | Secret đọc từ env, mặc định rỗng, fail closed, không in ra stdout |
| `git-workflow` | `develop` là nhánh làm việc, merge vào `main` là lệnh deploy production |

@.claude/rules/no-hardcoded-strings.md
@.claude/rules/api-contract.md
@.claude/rules/backend-layers.md
@.claude/rules/mongodb-access.md
@.claude/rules/frontend-architecture.md
@.claude/rules/async-ui-state.md
@.claude/rules/auth-and-roles.md
@.claude/rules/domain-invariants.md
@.claude/rules/design-system.md
@.claude/rules/testing.md
@.claude/rules/secrets-from-env.md
@.claude/rules/git-workflow.md

## Lệnh

`make check` chạy lint + typecheck + test cho cả hai phía — chạy nó trước khi coi là
xong việc. Ngoài ra: `make dev-api`, `make dev-web`, `make test`, `make lint`,
`make typecheck`, `make install`.

Mongo phải chạy trước thì API mới khởi động được: `docker compose up -d mongo`.
Phải chạy cả hai dev server mới dùng được app; chỉ mở Vite sẽ ra banner
"API unreachable".

### Backend (từ thư mục `backend/`)

Venv **không** tự kích hoạt — gọi binary theo đường dẫn, nếu không `pytest` sẽ dùng
nhầm interpreter.

```bash
.venv/bin/pytest -q                                          # toàn bộ test
.venv/bin/pytest tests/test_meters_invoices.py -k resend     # một case
.venv/bin/ruff check . --fix
.venv/bin/mypy app tests scripts                             # chế độ strict
.venv/bin/python -m scripts.seed                             # dữ liệu demo
```

`scripts/seed.py` chạy lại được nhiều lần: nó tạo một admin, tám phòng, năm hợp đồng,
ba kỳ đã xuất hóa đơn, và vài liên hệ. Chạy lại thì bù thêm dữ liệu còn thiếu. Nhưng nó
chỉ **tạo** operator, gặp tài khoản đã có thì bỏ qua — sửa tài khoản có sẵn thì dùng
`scripts/set_admin_password.py` (đổi mật khẩu) hoặc `scripts/set_admin_email.py` (đổi
email, tìm theo `SEED_ADMIN_USERNAME`). Cả ba đọc secret từ env; xem rule
`secrets-from-env`.

### Frontend (từ thư mục `frontend/`)

```bash
npm test                            # toàn bộ test, chạy một lần
npm test -- metersSlice             # một file
npm test -- -t "locks the inputs"   # một test theo tên
npm run test:watch
npm run typecheck
npm run lint                        # oxlint
```

### Docker

`make docker-up` build và chạy stack dev — mongo, backend, frontend, mỗi cái chờ
healthcheck của cái trước; cả hai app hot-reload từ source được mount.
`make docker-prod` chạy stack production: backend chạy dưới user không đặc quyền,
frontend build thành static asset và phục vụ bởi nginx ở :80, nginx cũng proxy `/api`.

Cả hai Dockerfile đều multi-stage với target `dev` và `prod`; compose chọn target,
nên đừng bao giờ thêm Dockerfile thứ ba.

## Deploy

Frontend trên **Vercel**, backend trên **Render**, database trên **MongoDB Atlas**.
Quy trình đầy đủ nằm trong `DEPLOY.md` — đây chỉ là những gì ảnh hưởng tới lúc viết code:

- `vercel.json` rewrite `/api/*` sang Render, `frontend/nginx.conf` làm điều đó trong
  Docker, `vite.config.ts` làm lúc dev. **Cả ba đường đều là proxy**, nên frontend luôn
  gọi đường dẫn tương đối và không bao giờ cần biết host của backend.
- `render.yaml` là blueprint duy nhất. Thêm một biến môi trường mới cho backend thì
  thêm vào cả `render.yaml` và `backend/.env.example`, nếu không bản deploy sẽ chạy với
  giá trị rỗng mà không báo gì — `Settings` đặt `extra="ignore"`.
- Gói free của Render ngủ sau 15 phút không có request. Đó là lý do có
  `POST /invoices/dispatch` và `SCHEDULER_ENABLED` — xem mục dưới.

Đừng dán connection string Atlas hay secret của Render vào file được commit; xem rule
`secrets-from-env`.

## Email và lập lịch

`services/email.py` gửi mail qua HTTP API của Resend (`httpx`, port 443) — **không phải
SMTP**: Render chặn outbound 25/465/587 ở tầng network nên mọi lần gửi qua SMTP đều
timeout sau 60 giây. **Nếu `RESEND_API_KEY` không được đặt, nó
ghi log nội dung thay vì gửi thật**, nên không cần mail server để chạy thử các luồng
có gửi email. `services/scheduler.py` chạy một cron job APScheduler duy nhất, gửi hóa
đơn nháp hằng tháng; lifespan khởi động và dừng nó để một lần reload không làm chạy
song song hai scheduler trên cùng một database.

Scheduler chỉ chạy khi process còn sống, nên bản deploy trên gói free ngủ giữa các
request sẽ không bao giờ nổ job. Vì vậy có đường thứ hai: `POST /invoices/dispatch`
gọi đúng cùng một `invoice_service.send_pending()`, bảo vệ bằng `CronDep`, để một cron
bên ngoài kích hoạt. Đặt `SCHEDULER_ENABLED=false` ở những nơi dùng đường này. Gọi lặp
là vô hại — xem rule `auth-and-roles`.
