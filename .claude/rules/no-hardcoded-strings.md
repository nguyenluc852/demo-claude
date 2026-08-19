---
name: no-hardcoded-strings
description: Mọi đường dẫn route, thông báo, nhãn, giá trị enum và số ma thuật phải nằm trong module hằng số — không viết thẳng trong code.
applies-to: backend/app/**, frontend/src/**
---

# Không hardcode chuỗi — cả hai phía

Đây là ràng buộc định hình cả dự án.

| Phía | File | Chứa |
|---|---|---|
| BE | `app/core/constants.py` | Route, tag, tên collection, tên field, enum, giới hạn |
| BE | `app/core/messages.py` | Mã lỗi và mọi thông báo API trả về |
| FE | `src/constants/strings.ts` | Mọi text người dùng nhìn thấy |
| FE | `src/constants/api.ts` | Đường dẫn endpoint, HTTP method, header, mã lỗi |
| FE | `src/constants/config.ts` | Enum, tên slice, trạng thái request, đường dẫn route |

## Quy tắc

- Một chuỗi viết thẳng trong router, service, hay component là lỗi. `@router.get("/rooms")`
  là sai; `@router.get(Route.ROOMS)` mới đúng.
- Test tuân theo đúng quy tắc này — assert vào hằng số, không phải vào text.
- Tên class CSS và giá trị `data-*` là ngoại lệ duy nhất: chúng là cấu trúc, không phải
  nội dung.
- **Giao diện bằng tiếng Việt.** Text mới hiển thị cho người dùng thì thêm vào
  `strings.ts`; thông báo API mới thì thêm vào `messages.py`.

## Giữ hai phía đồng bộ

`app/core/constants.py` và `src/constants/api.ts` mô tả cùng một tập route, còn các
khối enum trong `constants.py` và `config.ts` mô tả cùng một tập giá trị. Sửa bên này
thì phải sửa bên kia trong cùng một lần chỉnh sửa.

Dùng `Literal` của Pydantic sẽ buộc phải lặp lại các giá trị enum đó xuống tầng schema,
nên schema validate bằng `one_of(value, SomeEnum.ALL)` thay vì `Literal`.

## Nợ kỹ thuật đã biết

`"email_verified"` vẫn là literal ở 8 chỗ trong tầng service (`services/user.py` ×4,
`services/auth.py` ×3, `services/contract.py` ×1). Đây đúng loại defect mà rule này
cấm — key của document phải là hằng trong `Field`. Đã biết và cố ý hoãn, chưa dọn.

Dọn nốt thì thêm `Field.EMAIL_VERIFIED` vào `core/constants.py` rồi đổi cả 8 chỗ; bộ
test đỡ lưng nên rủi ro thấp. Đừng dọn lẻ tẻ giữa một thay đổi không liên quan — hoặc
làm trọn cả 8, hoặc để nguyên.

(Literal `"email_verified"` trong `app/schemas/*.py` thì hợp lệ: đó là tên thuộc tính
Pydantic, không phải key tra cứu.)
