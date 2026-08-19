# Deploy

Frontend trên Vercel, backend trên Render, database trên MongoDB Atlas.

Vercel rewrite `/api/*` sang Render, nên trình duyệt vẫn chỉ thấy **một origin** —
đúng cách `vite.config.ts` proxy lúc dev và `frontend/nginx.conf` làm trong Docker.
Không đổi gì trong code frontend: `src/api/client.ts` vẫn gọi đường dẫn tương đối.

Backend **không** đặt trên nền tảng serverless vì `app/main.py` khởi động APScheduler
trong lifespan — job gửi hoá đơn nháp hằng tháng cần một process sống lâu.

## CI/CD trên GitHub Actions

Bốn workflow trong `.github/workflows/`:

| Workflow | Kích hoạt | Làm gì |
|---|---|---|
| `ci.yml` | mọi push, mọi PR | ruff + mypy + pytest (kèm service Mongo 7), oxlint + tsc + vitest + build |
| `deploy.yml` | push vào `main`, hoặc bấm tay | gọi lại `ci.yml`, xanh mới deploy backend lên Render và frontend lên Vercel |
| `admin-ops.yml` | chỉ bấm tay | chạy `seed`, `set_admin_password`, `set_admin_email`, `reset_invoice_draft`, `set_contract_email` trên database production |
| `invoice-dispatch.yml` | 01:00 UTC ngày 5 hằng tháng, hoặc bấm tay | `POST /api/v1/invoices/dispatch` — job gửi hoá đơn nháp |

`deploy.yml` gọi `ci.yml` như reusable workflow, nên bộ kiểm tra chỉ có một định
nghĩa và **không có đường nào đưa code chưa qua test lên production**. Vì thế
`render.yaml` đặt `autoDeploy: false` và `vercel.json` tắt git deployment cho nhánh
`main` — bật lại một trong hai là mở lại đúng cái cửa đó.

### Secret cần đặt

Tất cả nằm trong **Settings → Environments → `production`** của repo (tạo environment
tên `production`, thêm required reviewers nếu muốn mỗi lần deploy phải có người duyệt).

| Tên | Loại | Lấy ở đâu |
|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | secret | Render → service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | secret | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | secret | `.vercel/project.json` sau khi chạy `npx vercel link` |
| `VERCEL_PROJECT_ID` | secret | cùng file trên |
| `MONGODB_URL` | secret | connection string Atlas — chỉ `admin-ops.yml` dùng |
| `SEED_ADMIN_PASSWORD` | secret | mật khẩu admin muốn đặt |
| `CRON_SECRET` | secret | tự sinh, phải trùng với `CRON_SECRET` ở dashboard Render |
| `RENDER_API_URL` | variable | `https://demo-claude-r8ml.onrender.com` (không có `/api`) |
| `RENDER_HEALTH_URL` | variable | `https://demo-claude-r8ml.onrender.com/api/v1/health` |
| `MONGODB_DB` | variable | mặc định `motel` nếu bỏ trống |
| `SEED_ADMIN_USERNAME` | variable | mặc định `admin` |
| `SEED_ADMIN_EMAIL` | variable | email của tài khoản admin |

Biến runtime của backend (`MONGODB_URL`, `RESEND_API_KEY`, `JWT_SECRET`) vẫn nằm ở dashboard
Render, không đi qua Actions — deploy hook chỉ bảo Render build lại.

### Đổi mật khẩu admin mà không lộ ra ngoài

Đây là lý do có `admin-ops.yml`: đổi secret `SEED_ADMIN_PASSWORD` trong repo, rồi
Actions → **Admin ops** → Run workflow → chọn `set-admin-password`. Connection string
Atlas và mật khẩu không bao giờ xuất hiện trong shell history, trong file, hay trong
log — GitHub che mọi secret in ra, còn các script vốn đã chỉ in tên biến.

Nếu một credential đã từng lọt ra ngoài thì **xoay nó**, đừng chỉ xoá dòng đó đi:
commit cũ vẫn còn trong lịch sử git. Xoay = đổi mật khẩu database user trên Atlas, tạo
token Vercel mới, sinh lại deploy hook của Render, rồi cập nhật secret ở đây.

## Thứ tự

Backend phải có URL trước thì mới điền được vào `vercel.json`.

### 1. MongoDB Atlas

1. Tạo một cluster free (M0).
2. Tạo database user, và trong Network Access cho phép `0.0.0.0/0` — Render không
   cấp IP tĩnh ở gói free.
3. Lấy connection string dạng `mongodb+srv://...`. Driver đọc được `+srv` vì
   `dnspython` đi kèm `email-validator` trong `requirements.txt`.

Index được tạo tự động: `app/db/mongo.py` gọi `connect()` lúc khởi động và dựng mọi
index mà truy vấn dựa vào.

### 2. Backend trên Render

`render.yaml` ở gốc repo là blueprint. Trên Render: **New → Blueprint**, trỏ vào repo
này, rồi điền các biến `sync: false`:

| Biến | Giá trị |
|---|---|
| `MONGODB_URL` | Connection string Atlas ở bước 1 |
| `PUBLIC_BASE_URL` | Đã có sẵn trong `render.yaml`: `https://claudedom.vercel.app` |
| `CORS_ORIGINS` | Đã có sẵn trong `render.yaml` — nhớ giữ dạng mảng JSON nếu đổi |
| `RESEND_API_KEY` | API key ở resend.com → API Keys. Bỏ trống nếu chưa cần gửi mail thật |
| `EMAIL_FROM` | Địa chỉ gửi, phải thuộc domain đã verify trong Resend |

`JWT_SECRET` để Render tự sinh. **Đổi nó sau này sẽ làm mọi token hiện có hết hiệu lực.**

Bỏ trống `RESEND_API_KEY` thì `services/email.py` ghi log nội dung thay vì gửi — luồng
ký hợp đồng và gửi hoá đơn vẫn chạy được đầy đủ.

> **Đừng quay lại SMTP.** Render chặn outbound 25/465/587 ở tầng network trên gói free:
> kết nối không bị từ chối mà rơi vào hư không, nên mỗi lần gửi treo đúng 60 giây rồi
> ném `SMTPConnectTimeoutError`. Đổi port hay đổi chế độ TLS không cứu được. Đó là lý do
> mailer đi qua HTTPS.

> **Gói free ngủ sau 15 phút không có request.** Scheduler chỉ chạy khi process còn
> sống, nên job hoá đơn hằng tháng không bao giờ nổ trên gói free. Vì thế `render.yaml`
> đặt `SCHEDULER_ENABLED=false`, và workflow `invoice-dispatch.yml` gọi
> `POST /api/v1/invoices/dispatch` thay cho nó. Nâng lên Starter thì đổi
> `SCHEDULER_ENABLED` về `true` **và** tắt workflow đó — đừng chạy song song cả hai.

`CRON_SECRET` bảo vệ endpoint dispatch: sinh một chuỗi ngẫu nhiên
(`openssl rand -hex 32`), dán vào dashboard Render **và** vào GitHub Secret cùng tên.
Để trống thì endpoint từ chối mọi request, không bao giờ mở.

Kiểm tra: `curl https://<service>.onrender.com/api/v1/health` phải trả
`{"data":{"status":"ok","version":"..."}}`.

### 3. Frontend trên Vercel

`vercel.json` đã trỏ sẵn `/api/*` sang backend trên Render. Đổi backend sang host khác
thì sửa đúng một dòng `destination` ở đó — không có chỗ thứ hai.

Lần đầu phải link project từ máy bạn để lấy `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`;
sau đó mọi bản deploy đi qua `deploy.yml`.

```bash
npx vercel login      # xác thực — tự chạy, đừng để agent làm thay
npx vercel link       # ghi .vercel/project.json (đã bị .gitignore bỏ qua)
npx vercel --prod     # chỉ khi cần deploy tay
```

Rewrite thứ hai (`/:path*` → `/index.html`) là SPA fallback: thiếu nó thì F5 ở
`/admin/rooms` hay mở thẳng link xác thực email sẽ ra 404.

### 4. Nối ngược lại

`render.yaml` đã trỏ sẵn `PUBLIC_BASE_URL` và `CORS_ORIGINS` sang
`https://claudedom.vercel.app`. Đổi domain thì sửa hai dòng đó rồi deploy lại backend.

**`vercel.json` phải có mặt trên nhánh mà Vercel build**, và Root Directory của project
phải là gốc repo — không phải `frontend/`. Đặt sai chỗ thì Vercel bỏ qua file này:
trang chủ vẫn lên, nhưng `/api/*` và mọi đường dẫn con của SPA đều trả 404.

### 5. Dữ liệu demo (tuỳ chọn)

`scripts/seed.py` chạy lại được nhiều lần. Chạy từ máy bạn, trỏ vào Atlas:

```bash
cd backend
MONGODB_URL='mongodb+srv://...' .venv/bin/python -m scripts.seed
```

Tạo một admin, tám phòng, năm hợp đồng, ba kỳ đã xuất hoá đơn. Không có dữ liệu phòng
thì trang chủ hiện trạng thái rỗng và dải toà nhà đếm ra 0.

`SEED_ADMIN_PASSWORD` bắt buộc phải có, seed từ chối chạy nếu thiếu — xem rule
`.claude/rules/secrets-from-env.md`.

### 6. Xoay thông tin đăng nhập admin trên Atlas

`seed.py` chỉ **tạo** operator, gặp tài khoản đã tồn tại thì bỏ qua, nên nó không sửa
được tài khoản có sẵn. Hai script riêng làm việc đó.

**Cách nên dùng là workflow `Admin ops`** ở mục CI/CD bên trên — không phải dán
connection string vào terminal. Phần dưới đây là đường chạy tay, giữ lại cho lúc gỡ lỗi:

```bash
cd backend

# Đổi mật khẩu
MONGODB_URL='mongodb+srv://...' \
  SEED_ADMIN_EMAIL='admin@smart.dev' \
  SEED_ADMIN_PASSWORD='<mật khẩu mới>' \
  .venv/bin/python -m scripts.set_admin_password

# Đổi email (tìm tài khoản theo SEED_ADMIN_USERNAME, mặc định "admin")
MONGODB_URL='mongodb+srv://...' \
  SEED_ADMIN_EMAIL='admin@smart.dev' \
  .venv/bin/python -m scripts.set_admin_email
```

Cả hai in ra tên database đang tác động trước khi ghi, và không in mật khẩu. Chạy lại
là vô hại: `set_admin_email` báo "already …; nothing to do" nếu email đã đúng.

Đừng dán connection string Atlas vào chỗ nào được commit — nó chỉ nên xuất hiện trong
shell của bạn và trong dashboard Render.

## Kiểm tra sau khi deploy

1. Trang chủ không hiện banner "API unreachable".
2. Lưới phòng có phòng, dải toà nhà hiện đúng số phòng.
3. Gửi form giữ chỗ → hiện thông báo thành công.
4. Đăng nhập được vào `/admin`, F5 giữa chừng không bị đá về màn hình đăng nhập.
