---
name: auth-and-roles
description: Ba vai trò người dùng, dependency phân quyền mà mỗi nhóm route phải khai báo, và lối vào riêng cho scheduler.
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

## Lối vào cho máy, không phải cho người

`CronDep` là dependency thứ năm và là ngoại lệ duy nhất: nó xác thực bằng secret dùng
chung trong header `X-Cron-Secret` chứ không bằng JWT, và **không đại diện cho một
`UserRole` nào** — người gọi là một scheduler bên ngoài, không phải một tài khoản.

| Dependency | Cho phép |
|---|---|
| `CronDep` | scheduler bên ngoài, chỉ dùng cho `POST /invoices/dispatch` |

Hai điều ràng buộc nó, đừng nới ra:

- **Fail closed.** `cron_secret` rỗng thì từ chối mọi request, không bao giờ mở. Một
  lần quên đặt biến môi trường không được biến endpoint thành công khai.
- **So sánh bằng `secrets.compare_digest`**, không phải `==`.

Nó tồn tại vì `services/scheduler.py` chỉ chạy khi process còn sống, mà bản deploy trên
gói free ngủ giữa các request. Endpoint dispatch là đường thứ hai vào đúng một lời gọi
`invoice_service.send_pending()` — không phải một nhánh logic riêng. Gọi lặp là vô hại
vì `send_pending()` chỉ quét hoá đơn `DRAFT`, còn `send()` đẩy chúng sang `UNPAID`.

Dùng `CronDep` cho một route mà con người bấm được là sai chỗ: nó không biết ai gọi,
nên không có gì để ghi vết hay phân quyền tiếp.

`current_user` đọc lại bản ghi user ở mỗi request, nên việc đổi vai trò hay xóa tài
khoản có hiệu lực ngay lập tức thay vì phải đợi token hết hạn. Đừng "tối ưu" nó thành
tin vào claim trong token.
