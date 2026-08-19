---
name: frontend-architecture
description: Các tầng atomic design, ai được chạm vào Redux, routing và nhãn trạng thái, và các ràng buộc TypeScript mà bản build bắt buộc.
applies-to: frontend/src/**
---

# Kiến trúc frontend

## Các tầng

Atomic design: `components/atoms` → `molecules` → `organisms` → `templates` → `pages`.

- **Chỉ organism được chạm vào Redux store**; mọi tầng dưới nhận dữ liệu qua props.
- State là các slice Redux Toolkit trong `src/store/slices/`, truy cập qua các hook đã
  gắn kiểu trong `src/store/hooks.ts`.
- Mọi lời gọi HTTP đi qua `src/api/client.ts`, không dùng `fetch` trần.

## Routing và nhãn

- Routing dùng react-router trong `App.tsx`. Đường dẫn nằm trong `ROUTE_PATH`
  (`constants/config.ts`).
- `RequireRole` bảo vệ route: nó đổi token đã lưu lấy thông tin user trước khi quyết
  định, nhờ vậy F5 trong CMS không đá người quản lý về màn hình đăng nhập.
- `src/utils/labels.ts` ánh xạ giá trị enum của backend sang nhãn tiếng Việt và màu
  badge tương ứng. Lấy nhãn trạng thái từ đó để mọi nơi viết giống nhau — không viết
  lại tên trạng thái ngay trong component.

## TypeScript

- `erasableSyntaxOnly` đang bật: constructor parameter property, `enum`, và `namespace`
  đều là lỗi biên dịch. Dùng object `as const` cộng một union suy ra từ nó thay cho enum.
- Ưu tiên discriminated union thay vì nhiều boolean song song cho state của UI.
- Dispatch thunk kiểu bắn-rồi-quên thì thêm tiền tố `void`.
