---
name: auth-and-roles
description: Ba vai trò người dùng và dependency phân quyền mà mỗi nhóm route phải khai báo.
applies-to: backend/app/api/**, backend/app/common/deps.py, backend/app/services/user.py
---

# Xác thực và phân quyền

Ba vai trò trong `UserRole`: `admin`, `manager`, `tenant`. Các dependency trong
`common/deps.py` quy định ai được gọi cái gì — **mọi route của CMS và của cổng khách
thuê đều phải khai báo một trong số đó.**

| Dependency | Cho phép |
|---|---|
| `CurrentUserDep` | mọi user đã đăng nhập |
| `StaffDep` | admin + manager — toàn bộ CMS nằm sau dependency này |
| `AdminDep` | chỉ admin — quản trị tài khoản |
| `TenantDep` | chỉ khách thuê — cổng tự phục vụ |

Bề mặt không cần đăng nhập là cố ý và rất nhỏ: `api/v1/public.py` (trang chủ và form
liên hệ), các route đăng nhập và xác thực email trong `auth.py`, và `health.py`. Một
route mới nằm ngoài các file đó mà không có dependency là lỗ hổng, không phải tính năng.

`current_user` đọc lại bản ghi user ở mỗi request, nên việc đổi vai trò hay xóa tài
khoản có hiệu lực ngay lập tức thay vì phải đợi token hết hạn. Đừng "tối ưu" nó thành
tin vào claim trong token.
