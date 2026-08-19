---
name: testing
description: Test nằm ở đâu, phải dùng fixture nào, và cơ chế cách ly database mà bộ test backend dựa vào.
applies-to: frontend/src/**/*.test.ts, frontend/src/**/*.test.tsx, backend/tests/**
---

# Testing

## Frontend

Test nằm cạnh source (`*.test.ts[x]`) và dùng `renderWithStore` từ
`src/test/utils.tsx`, hàm này dựng một store mới cho mỗi test. Giả lập network bằng
`vi.stubGlobal('fetch', ...)` và trả về đúng dạng envelope thật — một stub trả về
object trần thay vì `{ data: ... }` là đang test một hợp đồng mà app không hề có.

## Backend

Test nằm trong `backend/tests/`. `conftest.py` **trỏ cả bộ test sang database riêng của
nó** (`<db>_test`) trước khi import app, rồi xóa sạch mọi collection nó chạm vào giữa
các case — bộ test không bao giờ được có khả năng xóa dữ liệu mà một dev server đang
chạy phục vụ. Đừng trỏ test vào database dev và đừng làm yếu cơ chế cách ly đó.

Dựng dữ liệu mẫu bằng các helper trong `tests/factories.py`.

## Cả hai phía

Assert vào hằng số (`messages.py`, `strings.ts`, `constants.py`), không bao giờ assert
vào text viết thẳng — xem rule `no-hardcoded-strings`.
