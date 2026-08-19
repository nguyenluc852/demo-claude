---
name: design-system
description: Toàn bộ hệ thống hình ảnh nằm trong một file CSS — bảng màu, vai trò chữ, và các màu nhấn không được phép mở rộng.
applies-to: frontend/src/index.css, frontend/src/components/**, frontend/src/pages/**
---

# Design system

`frontend/src/index.css` chứa toàn bộ hệ thống; **không có CSS-in-JS và không có
utility framework**. Đọc phần chú thích ở đầu file đó trước khi đổi bất cứ thứ gì về
hình ảnh. Với việc thiết kế ở quy mô lớn hơn, hãy nạp skill `frontend-design`.

Định hướng thiết kế bám vào hai vật dụng mà nghề này chạy trên đó — công tơ điện và
cuốn sổ kẻ dòng mà chủ trọ ghi chỉ số vào. Vì vậy nền là màu giấy sổ chứ không phải
trắng, chữ màu mực bút bi chứ không phải đen, đường kẻ mảnh là dải phân cách duy nhất,
và `--font-mono` dùng cho **mọi con số** (chỉ số, số phòng, tiền, kỳ).

## Ràng buộc

- Màu bão hòa chỉ được dùng ở hai chỗ: `--seal-600` cho hành động chính và lỗi, và bốn
  màu trạng thái phòng mà SRS đã chốt (xanh lá còn trống, đỏ đang thuê, hổ phách đang
  bảo trì, tím đang nợ). **Thêm màu nhấn thứ ba là một bước lùi.**
- Vai trò của chữ: `--font-display` (Bricolage Grotesque, tiêu đề), `--font-body`
  (Be Vietnam Pro — chọn vì nó đặt dấu tiếng Việt đúng), và `--font-mono`
  (IBM Plex Mono, dữ liệu).
- Màu, bước giãn cách, hay bo góc mới đều phải trở thành token trong `index.css`; không
  viết thẳng trong component.
