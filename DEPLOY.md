# Deploy

Frontend trên Vercel, backend trên Render, database trên MongoDB Atlas.

Vercel rewrite `/api/*` sang Render, nên trình duyệt vẫn chỉ thấy **một origin** —
đúng cách `vite.config.ts` proxy lúc dev và `frontend/nginx.conf` làm trong Docker.
Không đổi gì trong code frontend: `src/api/client.ts` vẫn gọi đường dẫn tương đối.

Backend **không** đặt trên nền tảng serverless vì `app/main.py` khởi động APScheduler
trong lifespan — job gửi hoá đơn nháp hằng tháng cần một process sống lâu.

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
| `SMTP_*` | Bỏ trống nếu chưa cần gửi mail thật |

`JWT_SECRET` để Render tự sinh. **Đổi nó sau này sẽ làm mọi token hiện có hết hiệu lực.**

Bỏ trống `SMTP_HOST` thì `services/email.py` ghi log nội dung thay vì gửi — luồng ký
hợp đồng và gửi hoá đơn vẫn chạy được đầy đủ.

> **Gói free ngủ sau 15 phút không có request.** Scheduler chỉ chạy khi process còn
> sống, nên job hoá đơn hằng tháng sẽ không đáng tin trên gói free. Cần nó chạy thật
> thì nâng lên Starter.

Kiểm tra: `curl https://<service>.onrender.com/api/v1/health` phải trả
`{"data":{"status":"ok","version":"..."}}`.

### 3. Frontend trên Vercel

`vercel.json` đã trỏ sẵn `/api/*` sang backend trên Render. Đổi backend sang host khác
thì sửa đúng một dòng `destination` ở đó — không có chỗ thứ hai.

```bash
npx vercel login      # xác thực — tự chạy, đừng để agent làm thay
npx vercel --prod
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

## Kiểm tra sau khi deploy

1. Trang chủ không hiện banner "API unreachable".
2. Lưới phòng có phòng, dải toà nhà hiện đúng số phòng.
3. Gửi form giữ chỗ → hiện thông báo thành công.
4. Đăng nhập được vào `/admin`, F5 giữa chừng không bị đá về màn hình đăng nhập.
