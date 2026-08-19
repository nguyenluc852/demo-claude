---
name: api-contract
description: Tiền tố route, envelope phản hồi dùng chung, và cách ném lỗi qua ranh giới proxy.
applies-to: backend/app/api/**, backend/app/common/**, backend/app/main.py, frontend/src/api/**
---

# Hợp đồng API

## Hai app nối bằng proxy, không phải CORS

`frontend/vite.config.ts` proxy `/api/*` sang backend (target đổi được qua
`VITE_PROXY_TARGET`, Docker đặt biến này thành tên service `backend`); ở production
`frontend/nginx.conf` làm đúng việc đó. Vì vậy trình duyệt luôn chỉ thấy một origin
duy nhất. Middleware CORS trong `app/main.py` chỉ dành cho những lần deploy mà điều đó
không còn đúng.

Hệ quả: **mọi route backend phải nằm dưới `/api/v1`**, nếu không proxy sẽ không chuyển
tiếp. `app/api/v1/router.py` gom các router theo feature, và `main.py` mount nó dưới
tiền tố `/api` — đó là chỗ duy nhất việc mount xảy ra.

## Envelope phản hồi dùng chung

Mọi endpoint trả về một trong ba dạng, định nghĩa trong `backend/app/common/schemas.py`
và phản chiếu ở `frontend/src/types/api.ts`:

- một tài nguyên → `{"data": {...}}`
- một danh sách → `{"data": [...], "meta": {"page", "size", "total"}}`
- mọi lỗi → `{"error": {"code", "message"}}`

Route xuất PDF hóa đơn là ngoại lệ cố ý duy nhất: nó trả về bytes, không phải JSON.

## Lỗi

Service ném các lớp con của `AppError` (`NotFoundError`, `ConflictError`,
`BadRequestError`, `UnauthorizedError`, `ForbiddenError`) từ
`app/common/exceptions.py`; các handler trong `main.py` chuyển chúng thành envelope lỗi.

**Không bao giờ ném `HTTPException` trực tiếp** — nó đi vòng qua envelope và làm hỏng
phần parse `ApiError` ở frontend.

## Phía frontend

Mọi lời gọi HTTP đi qua `src/api/client.ts`, không dùng `fetch` trần. Đường dẫn endpoint
lấy từ `src/constants/api.ts`, và file này phải luôn khớp với `app/core/constants.py`.
