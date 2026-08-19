---
name: backend-layers
description: Ranh giới giữa các tầng, helper dùng chung trong common/, yêu cầu về Pydantic và phân trang, kiểu dữ liệu chặt.
applies-to: backend/app/**
---

# Các tầng backend và quy ước Python

Route `api/v1/` (mỏng) → logic nghiệp vụ `services/` → model Pydantic `schemas/`.
Các phần dùng chung nằm ở `common/` và `core/` (settings, constants, messages).
Route chỉ validate, ủy quyền, rồi bọc kết quả — logic nghiệp vụ không nằm trong router.

## Tái dùng `common/` trước khi viết service

| Module | Dùng để |
|---|---|
| `documents.py` | `serialize()` (`_id` → `id`) và `to_object_id()` (id sai → 404) |
| `money.py` | `to_vnd()` — làm tròn mọi số tiền ngay tại chỗ sinh ra nó |
| `periods.py` | Kỳ hóa đơn `YYYY-MM`: `current_period`, `shift_period`, `recent_periods` |
| `security.py` | Băm mật khẩu, encode/decode JWT |
| `validators.py` | `one_of()` — neo các field dạng enum về `constants.py` |

Mở rộng những module này; đừng tách ra một cách làm thứ hai cho cùng một việc.

## Schema và phân trang

- Body request/response là model Pydantic, nối qua `response_model=`.
- Giới hạn của field đặt trong `Field(...)` để việc validate mang tính khai báo.
- Endpoint trả danh sách phải nhận `PaginationDep` — **không cho phép trả danh sách
  không giới hạn.** Lưới phòng và lưới chỉ số bị chặn bởi `Pagination.GRID_SIZE` thay
  vì phân trang thường, nhưng vẫn trả về envelope có `meta`.

## Kiểu dữ liệu

- Python dùng kiểu chặt (`mypy` strict). Chú thích kiểu cho mọi tham số và giá trị trả
  về, kể cả `-> None`.
- Dùng cú pháp 3.11: `list[str]`, `X | None`.
- Đặt tên một method của service là `list` sẽ che mất builtin `list` cho mọi chú thích
  kiểu viết sau đó trong cùng thân class. `services/room.py` xử lý bằng type alias ở
  cấp module; hãy làm tương tự thay vì đổi tên method.

## Phần scaffold không được đụng vào

`app/api/v1/{health,items}.py` là scaffold còn sót lại. `items` là demo lưu trong bộ
nhớ, không còn frontend nào dùng; đừng mở rộng nó, và đừng lấy nó làm mẫu cho code mới.
