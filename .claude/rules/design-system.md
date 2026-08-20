---
name: design-system
description: Toàn bộ hệ thống hình ảnh nằm trong một file CSS — bảng màu sáng, hình khối bo tròn, và màu nhấn không được phép mở rộng.
applies-to: frontend/src/index.css, frontend/src/components/**, frontend/src/pages/**
---

# Design system

`frontend/src/index.css` chứa toàn bộ hệ thống; **không có CSS-in-JS và không có
utility framework**. Đọc phần chú thích ở đầu file đó trước khi đổi bất cứ thứ gì về
hình ảnh. Với việc thiết kế ở quy mô lớn hơn, hãy nạp skill `frontend` và đọc Phần B.

Định hướng là **sáng và thoáng**: nền trắng ngà, panel cam pastel, một màu nhấn cam
duy nhất. Không gian được chia bằng **panel bo góc và bóng mềm**, không phải đường kẻ
— viền chỉ xuất hiện ở chỗ hai control không được phép nhìn nhầm thành một.

Bo góc rộng tay và nút bo tròn hoàn toàn thành viên thuốc. Nhưng con số vẫn giữ
`--font-mono`: chỉ số, số phòng, tiền, kỳ — dữ liệu thuộc về cột.

## Ràng buộc

- **`--orange-600` là màu nền, không phải màu chữ.** Chữ trắng trên nó chỉ đạt 2.3:1;
  mọi thứ nằm *trên* màu nhấn phải dùng `--slate-900` (7.7:1). Cần màu nhấn cho chữ
  trên nền trắng thì dùng `--orange-700` — nó vượt 4.5:1, còn 600 thì không.
- Màu bão hòa chỉ được dùng ở hai chỗ: `--orange-600` cho hành động chính và lỗi, và
  bốn màu trạng thái phòng mà SRS đã chốt (xanh lá còn trống, đỏ đang thuê, hổ phách
  đang bảo trì, tím đang nợ). **Thêm màu nhấn thứ ba là một bước lùi.**
  `--sage-*` và `--sand-*` là màu phụ trợ rất nhạt cho xác nhận và cảnh báo, không
  phải màu nhấn — đừng nâng chúng lên thành nhân vật chính.
- Nhóm token màu: `--slate-*` (thang trung tính ấm), `--orange-*`
  (nhấn), `--status-*` (SRS chốt). Toàn bộ token chỉ được dùng trong `index.css`;
  **không component nào đọc token màu trực tiếp.**
- Vai trò của chữ: `--font-display` (Bricolage Grotesque, tiêu đề), `--font-body`
  (Be Vietnam Pro — chọn vì nó đặt dấu tiếng Việt đúng), và `--font-mono`
  (IBM Plex Mono, dữ liệu).
- Bo góc lấy từ `--radius-sm|--radius|--radius-lg|--radius-xl`, và `--radius-pill`
  cho nút. Viết thẳng một giá trị `px` cho bo góc là sai.
- Màu, bước giãn cách, hay bo góc mới đều phải trở thành token trong `index.css`; không
  viết thẳng trong component.
- Mọi hiệu ứng chuyển động phải tắt trong `@media (prefers-reduced-motion: reduce)` —
  file đã có sẵn một block, mở rộng nó chứ đừng viết block thứ hai.

## Lịch sử

Hệ thống trước đây bám vào công tơ điện và cuốn sổ kẻ dòng: nền giấy, mực bút bi,
đường kẻ mảnh, màu nhấn đỏ con dấu, và một khối "ledger" ở hero trang chủ tự viết ra
phép tính hoá đơn. Định hướng đó đã bị thay bằng bảng màu sáng hiện tại theo yêu cầu
sản phẩm. Đừng khôi phục lại từng mảnh của nó — nền giấy kẻ, viền cứng, hay bo góc
2px xuất hiện lại là dấu hiệu ai đó đang trộn hai hệ thống.
