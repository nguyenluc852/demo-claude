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
- **`--water-600` là màu mã hóa dữ liệu, không phải ngoại lệ của quy tắc trên.**
  Biểu đồ mức sử dụng vẽ điện và nước cạnh nhau, nên hai chuỗi buộc phải phân biệt
  được bằng màu; điện mượn màu nhấn, nước lấy token này. Nó chỉ được dùng làm màu
  chuỗi dữ liệu — không cho control, không cho trạng thái, không cho chữ. Cần thêm
  một chuỗi dữ liệu nữa thì thêm token cùng nhóm này, đừng với tay lấy `--sage-*`.
- Nhóm token màu: `--slate-*` (thang trung tính ấm), `--orange-*` (nhấn),
  `--status-*` (SRS chốt), `--water-600` (mã hóa dữ liệu). Toàn bộ token chỉ được
  dùng trong `index.css`; **không component nào đọc token màu trực tiếp.**
  Ngoại lệ duy nhất là biểu đồ: recharts nhận màu bằng giá trị JS chứ không qua
  class, nên `RevenueChart` và `TenantPortal` khai `'var(--token)'` thành hằng ở
  đầu file. Vẫn là token, chỉ là đi đường khác — đừng viết hex vào component.
- Vai trò của chữ: `--font-display` (Bricolage Grotesque, tiêu đề), `--font-body`
  (Be Vietnam Pro — chọn vì nó đặt dấu tiếng Việt đúng), và `--font-mono`
  (IBM Plex Mono, dữ liệu).
- Bo góc lấy từ `--radius-sm|--radius|--radius-lg|--radius-xl`, và `--radius-pill`
  cho nút. Viết thẳng một giá trị `px` cho bo góc là sai.
- Màu, bước giãn cách, hay bo góc mới đều phải trở thành token trong `index.css`; không
  viết thẳng trong component.
- Mọi hiệu ứng chuyển động phải tắt trong `@media (prefers-reduced-motion: reduce)` —
  file đã có sẵn một block, mở rộng nó chứ đừng viết block thứ hai.

## Responsive

Hai breakpoint, mỗi cái có lý do riêng — đừng gộp lại thành một:

| Mốc | Đổi gì |
|---|---|
| `max-width: 860px` | Rail điều hướng CMS gập thành hamburger; **bảng đổi thành card** |
| `max-width: 640px` | Padding ngang hạ một nấc, header trang công khai xếp hai dòng |

**Bảng nhiều cột không đọc được trên điện thoại**, mà vuốt ngang thì tranh chấp với cử
chỉ back của trình duyệt. Cách xử lý đã chốt, dùng chung cho mọi bảng:

- Wrapper là `<div className="table-scroll table-cards">`.
- **Mỗi `<td>` dữ liệu mang `data-label` bằng đúng tiêu đề cột của nó.** Ô chứa nút thao
  tác cố ý không có — nó chiếm trọn chiều ngang của card.
- Dưới 860px, CSS đổi `table/tbody/tr/td` thành `display: block` và in nhãn qua
  `td::before { content: attr(data-label) }`.

**Một markup duy nhất, không dựng bản thứ hai cho mobile.** Hai bản nghĩa là hai nguồn
sự thật, và chỗ quên sửa sẽ im lặng. Thêm một cột thì thêm `data-label` cùng lúc —
có test đối chiếu danh sách `columnheader` với `data-label` nên quên là đỏ.

`thead` bị ẩn bằng visually-hidden (`clip-path`), **không phải `display: none`** — cách
kia gỡ tiêu đề khỏi accessibility tree, mà trình đọc màn hình vẫn cần nó để ghép cặp
tiêu đề–ô.

Ngoại lệ cố ý: bảng dòng hóa đơn trong modal (`InvoiceLineTable`) giữ nguyên dạng bảng
cuộn. Đó là dữ liệu cột thật, đọc bằng cách so hàng với hàng; đổi thành card sẽ thành
mấy chục cặp nhãn–giá trị cho một hóa đơn.

## Lịch sử

Hệ thống trước đây bám vào công tơ điện và cuốn sổ kẻ dòng: nền giấy, mực bút bi,
đường kẻ mảnh, màu nhấn đỏ con dấu, và một khối "ledger" ở hero trang chủ tự viết ra
phép tính hoá đơn. Định hướng đó đã bị thay bằng bảng màu sáng hiện tại theo yêu cầu
sản phẩm. Đừng khôi phục lại từng mảnh của nó — nền giấy kẻ, viền cứng, hay bo góc
2px xuất hiện lại là dấu hiệu ai đó đang trộn hai hệ thống.
