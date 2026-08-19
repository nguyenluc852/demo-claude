---
name: backend-endpoint
description: Thêm hoặc sửa một endpoint FastAPI trong backend/. Dùng bất cứ khi nào công việc động tới route, router, schema request/response, logic tầng service, validation, hoặc một lỗi API ở backend Python — kể cả "thêm API cho X", "expose X qua HTTP", "endpoint phải trả về Y", đổi phân trang hay mã lỗi (add an API for X, expose X over HTTP, change pagination or error codes).
---

# Thêm một endpoint FastAPI

Backend đã có sẵn tầng nền. Hãy tái sử dụng — đừng tự nghĩ ra cách thứ hai để làm bất
kỳ việc nào dưới đây.

## Cái gì nằm ở đâu

| Hạng mục | File | Quy tắc |
|---|---|---|
| Đường dẫn route, tag, prefix, giới hạn | `app/core/constants.py` | Mọi đường dẫn và con số là một `Final` ở đây |
| Text hiển thị, mã lỗi | `app/core/messages.py` | Mọi chuỗi API trả về |
| Model request/response | `app/schemas/<feature>.py` | Chỉ Pydantic, không có logic |
| Logic nghiệp vụ | `app/services/<feature>.py` | Ném các lớp con của `AppError` |
| Route | `app/api/v1/<feature>.py` | Mỏng: validate, ủy quyền, bọc kết quả |
| Đăng ký router | `app/api/v1/router.py` | Chỗ duy nhất router được include |
| Envelope phản hồi, dependency dùng chung | `app/common/` | Mở rộng, đừng tách nhánh |

## Quy tắc quan trọng nhất

**Không có chuỗi trần hay số ma thuật nào nằm ngoài `core/constants.py` và
`core/messages.py`.** Bao gồm đường dẫn route, tag, thông báo lỗi, text trạng thái, và
tên header. Một route viết `@router.get("/items")` là sai; phải là
`@router.get(Route.ITEMS)`. Toàn bộ cách bố trí thư mục tồn tại để ép điều này — nếu
bạn đang gõ một chuỗi trong dấu nháy ở router hay service, chỗ của nó là module hằng số
trước đã.

## Các bước

1. **Hằng số trước.** Thêm đường dẫn vào `Route`, tag vào `Tag` (nếu là tag mới), và
   mọi giới hạn vào class tương ứng trong `app/core/constants.py`.
2. **Thông báo.** Thêm text lỗi vào `ErrorMessage`, và nếu có kiểu lỗi mới thì thêm mã
   vào `ErrorCode` trong `app/core/messages.py`.
3. **Schema.** Trong `app/schemas/<feature>.py`, theo đúng cách chia
   `ItemBase` / `ItemCreate` / `ItemUpdate` / `ItemSchema` của `app/schemas/item.py`.
   Đặt giới hạn field trong `Field(...)` để việc validate mang tính khai báo. Mọi field
   của `ItemUpdate` đều optional — cập nhật một phần dùng
   `model_dump(exclude_unset=True)`.
4. **Service.** Logic nghiệp vụ nằm trong `app/services/<feature>.py`. Nó ném
   `NotFoundError` / `ConflictError` từ `app.common.exceptions`, không bao giờ ném
   `HTTPException` — các handler trong `app/main.py` tự chuyển chúng thành envelope lỗi
   dùng chung.
5. **Router.** Trong `app/api/v1/<feature>.py`, giữ mỗi handler chỉ vài dòng. Bọc giá
   trị trả về trong `DataResponse[T]` cho một tài nguyên, hoặc `PageResponse[T]` cho
   một danh sách. Endpoint trả danh sách phải nhận `PaginationDep` — không cho phép
   danh sách không giới hạn.
6. **Đăng ký.** Thêm `api_router.include_router(<feature>.router)` vào
   `app/api/v1/router.py`. Không cần sửa gì khác; `main.py` mount toàn bộ router v1
   dưới tiền tố `/api`.
7. **Test.** Thêm `tests/test_<feature>.py` dùng fixture `client` từ
   `tests/conftest.py` (fixture này reset state cho mỗi test). Bao phủ luồng thành công,
   envelope 404/409, và một ca 422. Import đường dẫn và mã lỗi từ module hằng số — test
   cũng không được hardcode chuỗi.

## Hợp đồng envelope

Thành công với một tài nguyên là `{"data": {...}}`; danh sách là
`{"data": [...], "meta": {"page", "size", "total"}}`; mọi lỗi là
`{"error": {"code", "message"}}`. Client phụ thuộc vào điều này — trả về một dict trần
sẽ làm hỏng các kiểu TypeScript trong `frontend/src/types/api.ts`.

## Giữ frontend đồng bộ

`app/core/constants.py` và `frontend/src/constants/api.ts` mô tả cùng một tập đường dẫn.
Đổi một route hay một mã lỗi nghĩa là phải đổi cả hai, cộng thêm
`frontend/src/types/models.ts` nếu schema thay đổi.

## Kiểm chứng

```bash
cd backend
.venv/bin/pytest -q && .venv/bin/ruff check . && .venv/bin/mypy app tests
```

mypy chạy chế độ strict: chú thích kiểu cho mọi tham số và giá trị trả về, kể cả
`-> None`.
