---
name: secrets-from-env
description: Mọi thông tin nhạy cảm đọc từ biến môi trường, mặc định rỗng và fail closed — không bao giờ có giá trị thật trong file được commit.
applies-to: backend/app/core/config.py, backend/scripts/**, backend/.env.example, docker-compose.yml
---

# Secret lấy từ môi trường

Một mật khẩu, khoá, hay token viết thẳng trong file được commit là lỗi bảo mật, kể cả
khi nó "chỉ dùng cho dev". Repo này có remote công khai, và **commit sau không xoá được
nội dung commit trước** — một lần lọt là lọt vĩnh viễn trong lịch sử git.

## Quy tắc

- Secret khai báo trong `Settings` (`app/core/config.py`), **mặc định là chuỗi rỗng**.
  Không đặt giá trị thật làm default: default sẽ bị commit, và mọi deployment sẽ dùng
  chung nó.
- **Fail closed.** Thiếu secret thì từ chối chạy, không bao giờ rơi về giá trị dự phòng.
  Hai khuôn đã có sẵn, dùng lại chứ đừng nghĩ khuôn thứ ba:

  | Nơi | Cách từ chối |
  |---|---|
  | Dependency / route | `CronDep` — `cron_secret` rỗng thì chặn mọi request |
  | Script | `scripts/seed.py` — `SystemExit` kèm hướng dẫn đặt biến nào |

- `.env.example` liệt kê **tên biến với giá trị để trống**, kèm chú thích nói lấy giá
  trị ở đâu. Nó là tài liệu, không phải chỗ chứa giá trị thật.
- `.env` nằm trong `.gitignore` và phải ở nguyên đó. Không thêm ngoại lệ.
- **Không in secret ra stdout.** Terminal scrollback và log CI đều lưu lại. In tên biến
  (`"đăng nhập bằng SEED_ADMIN_PASSWORD"`), không in giá trị.
- So sánh secret bằng `secrets.compare_digest`, không phải `==`.
- Mật khẩu băm bằng `hash_password()` trong `common/security.py`, và lưu vào
  `Field.PASSWORD_HASH` — không bao giờ lưu dạng thô.
- Script nào ghi mật khẩu vào database phải tự kiểm tra
  `Limits.PASSWORD_MIN`/`PASSWORD_MAX`; API đã chặn ở mọi đường khác, script không được
  là cái lỗ.

## Dữ liệu mẫu

`scripts/seed.py` chứa tên, số CCCD, và email giả — đó là dữ liệu demo, không phải
secret, nên được phép nằm trong file. Ranh giới: cái gì mở được một tài khoản thì là
secret. Riêng email `nguyenluc1233@gmail.com` ở phòng 301 là hộp thư thật, cố ý giữ để
thử luồng gửi mail.

Mật khẩu trong `tests/conftest.py` là fixture trên database test dùng một lần
(`<db>_test`), không phải secret — nhưng đặt giá trị hiển nhiên là của test
(`pytest-fixture-only`) để không ai bị cám dỗ tái sử dụng.

## Đổi mật khẩu admin

`scripts/seed.py` chỉ **tạo** operator, gặp tài khoản đã tồn tại thì bỏ qua — nó không
xoay được mật khẩu. Dùng `scripts/set_admin_password.py` cho việc đó, cũng đọc từ
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
