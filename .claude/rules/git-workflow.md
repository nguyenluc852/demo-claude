# Git workflow

Hai nhánh sống mãi, và mỗi nhánh mang một nghĩa khác nhau:

| Nhánh | Nghĩa | Ai push vào |
|---|---|---|
| `develop` | Nhánh làm việc mặc định. Mọi thay đổi đi vào đây trước. | nhánh tính năng merge về |
| `main` | Cái đang chạy production. | chỉ `develop`, và chỉ khi release |

**Merge vào `main` chính là lệnh deploy production** — `.github/workflows/deploy.yml`
chạy khi có push vào `main`. Vì vậy **không commit thẳng vào `main`** và không mở PR
nhắm vào `main` trừ khi người dùng nói rõ là đang release. `ci.yml` bỏ qua `main`
(`branches-ignore`) vì `deploy.yml` đã chạy cùng bộ kiểm tra đó rồi — đừng "sửa" chỗ
đó thành chạy cả hai.

## Nhánh tính năng

Tách từ `develop`, merge ngược về `develop`, **không bao giờ merge thẳng lên `main`**.
Tiền tố theo loại việc — repo đang dùng `feat/`, `docs/`, `ci/`, `security/`, và `fix/`:

```bash
git checkout develop && git pull
git checkout -b feat/ten-tinh-nang
# ... làm việc, commit ...
git checkout develop && git merge feat/ten-tinh-nang
```

Thay đổi nhỏ, gọn trong một commit thì commit thẳng lên `develop` cũng được — không cần
dựng nhánh cho một dòng sửa.

## Release

Chỉ khi người dùng yêu cầu: `develop` → `main`, rồi `deploy.yml` tự đẩy frontend lên
Vercel và backend lên Render. `deploy.yml` bỏ qua `**.md` và `.claude/**`, nên thay đổi
thuần tài liệu vào `main` sẽ không nổ một lần deploy.

## Commit

- **Message viết bằng tiếng Việt**, mô tả *thay đổi gì và vì sao*, không dùng tiền tố
  kiểu Conventional Commits: "Bỏ default của EMAIL_FROM, thiếu nửa cấu hình thì không
  gửi".
- Chạy `make check` trước khi commit code (không cần nếu chỉ sửa tài liệu).
- Giao cho `code-reviewer` soát diff trước khi commit — xem mục Agents trong `CLAUDE.md`.
- **Không bao giờ commit `.env` hay secret**; xem rule `secrets-from-env`.
