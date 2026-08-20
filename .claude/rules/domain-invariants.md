---
name: domain-invariants
description: Các hành vi nghiệp vụ mà test đang khóa lại — hợp đồng, xác thực email, chỉ số, hóa đơn. Đổi một cái là đổi sản phẩm.
applies-to: backend/app/services/**, backend/tests/**
---

# Quy tắc nghiệp vụ không đọc ra được từ code

Đây là những hành vi mà test đang khóa lại; thay đổi chúng là thay đổi sản phẩm. Hãy
coi mọi chỉnh sửa ở đây là quyết định về sản phẩm, không phải refactor.

- **Ký hợp đồng làm ba việc**: tạo hợp đồng thuê, chuyển phòng sang `occupied`, và tạo
  tài khoản đăng nhập cho khách thuê (username = email, mật khẩu mặc định = số điện
  thoại) kèm email xác thực. Chấm dứt hoặc xóa hợp đồng thì trả phòng về `available`.
- **Khách thuê chưa bấm link xác thực thì chưa đăng nhập được.** Tài khoản nhân viên
  được tin cậy ngay khi tạo nên bỏ qua bước này. Sửa email trên hợp đồng sẽ reset trạng
  thái xác thực và gửi link mới.
- **Lưu đủ cả hai chỉ số của một kỳ thì kỳ đó xuất hóa đơn.** Chỉ một chỉ số thì không.
  Lưu lại lần nữa sẽ tính lại chính kỳ đó chứ không tạo hóa đơn thứ hai. Chỉ số nhỏ hơn
  chỉ số kỳ trước bị từ chối.
- **Dòng hóa đơn chụp lại đơn giá tại thời điểm xuất**, nên sửa bảng giá trong Cài đặt
  chung không bao giờ ghi đè hóa đơn đã phát hành.
- **Gửi lại hóa đơn không bao giờ ghi đè trạng thái thanh toán.** Gửi lần đầu chuyển
  hóa đơn nháp sang `unpaid`; gửi lại một hóa đơn đã trả một phần hoặc đã trả đủ thì
  giữ nguyên trạng thái đó.
- **Cổng khách thuê không bao giờ thấy hóa đơn `draft`.** Nháp là hóa đơn chưa phát
  hành: lưu lại chỉ số sẽ tính lại chính nó, nên hiện ra là báo cho khách một con số
  còn được phép đổi. `InvoiceStatus.TENANT_VISIBLE` chốt danh sách trạng thái được
  phép; thêm trạng thái mới thì phải quyết định nó có nằm trong đó không.
- **Trạng thái hợp đồng được suy ra theo thời gian lúc đọc** (`derive_status`), không
  lưu sẵn, nên "sắp hết hạn trong 30 ngày" luôn đúng tại thời điểm xem.

Số tiền được làm tròn bằng `to_vnd()` ngay tại chỗ sinh ra nó, không phải lúc hiển thị.
