# TÀI LIỆU YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENT SPECIFICATION - SRS)
## DỰ ÁN: HỆ THỐNG QUẢN LÝ PHÒNG TRỌ THÔNG MINH (SMART MOTEL MANAGEMENT SYSTEM)

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Hệ thống Quản lý Phòng trọ là giải pháp phần mềm toàn diện nhằm tối ưu hóa quy trình vận hành kinh doanh cho thuê bất động sản/phòng trọ. Hệ thống giải quyết bài toán từ khâu quảng bá dịch vụ đến khách hàng đại chúng (Homepage) cho tới các nghiệp vụ quản lý chuyên sâu của chủ trọ/vận hành (Admin Dashboard, CMS, Auto-Invoicing).

---

## 2. PHẠM VI HỆ THỐNG (SYSTEM SCOPE)

### 2.1. Đối tượng sử dụng (Actors)
* **Khách vãng lai / Khách thuê tiềm năng:** Tiếp cận thông tin dịch vụ qua trang chủ.
* **Quản trị viên (Admin / Chủ trọ):** Toàn quyền cấu hình hệ thống, quản lý số liệu, phòng ốc, hợp đồng và hóa đơn.

### 2.2. Các phân hệ chính
1.  **Trang chủ giới thiệu (Public Homepage)**
2.  **Bảng điều khiển trung tâm (Admin Dashboard)**
3.  **Phân hệ Quản lý CMS (Contract, Room & Invoice Management)**
4.  **Trang cấu hình hệ thống (Master Data Settings)**

---

## 3. YÊU CẦU CHỨC NĂNG CHI TIẾT (DETAILED FUNCTIONAL REQUIREMENTS)

### 3.1. Phân hệ Trang chủ (Public Homepage)
Mục tiêu: Giới thiệu thương hiệu, quảng bá các gói phòng và các tiện ích đi kèm nhằm thu hút khách thuê.

* **Giao diện & Nhận diện:** Đồ họa hiện đại, trực quan, hỗ trợ responsive (hiển thị tốt trên Mobile và Desktop).
* ** Khối thông tin Tiện ích cốt lõi:**
    * **Hệ thống PCCC (Phòng cháy chữa cháy):** Banner/Section nổi bật cam kết hệ thống đạt chuẩn an toàn, trang bị cảm biến khói tự động, vòi phun nước ngầm, lối thoát hiểm rõ ràng và bình chữa cháy định kỳ kiểm duyệt.
    * **Hệ thống Internet/Mạng:** Giới thiệu hạ tầng mạng cáp quang tốc độ cao, cam kết băng thông ổn định cho từng phòng, hệ thống Wifi phủ sóng toàn tòa nhà phục vụ làm việc/giải trí.
    * **Các tiện ích khác:** Khu vực để xe an ninh (Camera 24/7, khóa vân tay), dịch vụ vệ sinh không gian chung, khu giặt sấy tiện lợi.
* **Danh sách/Bộ sưu tập phòng mẫu:** Hiển thị hình ảnh thực tế, diện tích, giá thuê tham khảo và trạng thái phòng (Còn trống/Hết phòng).
* **Form liên hệ/Đăng ký giữ chỗ:** Cho phép người dùng gửi thông tin tư vấn trực tiếp về cho hệ thống CMS của Admin.

### 3.2. Bảng điều khiển Admin (Admin Dashboard)
Mục tiêu: Cung cấp góc nhìn tổng quan, nhanh chóng về tình hình kinh doanh và dòng tiền cho Chủ trọ.

* **Bảng danh sách các phòng trực quan (Room Grid/List View):**
    * Hiển thị tất cả các phòng dưới dạng lưới sinh động (gắn tag số phòng, tầng).
    * Mã hóa màu sắc theo trạng thái phòng: **Xanh** (Phòng trống), **Đỏ** (Đang có khách thuê), **Vàng** (Đang sửa chữa/Bảo trì), **Tím** (Khách chậm đóng tiền nhà).
    * Click nhanh vào từng phòng để xem thông tin nhanh (Tên khách, hạn hợp đồng).
* **Biểu đồ Doanh thu hàng tháng (Monthly Revenue Charts):**
    * Tích hợp biểu đồ trực quan (Biểu đồ cột - Bar Chart hoặc Biểu đồ đường - Line Chart).
    * Hiển thị dòng tiền theo các bộ lọc: Tháng hiện tại, Quý hiện tại, hoặc dòng thời gian 12 tháng gần nhất.
    * Phân tách rõ ràng các nguồn thu: Tổng doanh thu thực tế, Tiền phòng cố định, Tiền dịch vụ biến động (Điện, nước, internet...).

### 3.3. Phân hệ Quản lý CMS (Content Management System)

#### 3.3.1. Quản lý phòng cho thuê (Room Management)
* Thực hiện các thao tác CRUD (Thêm, sửa, xóa, xem chi tiết) danh mục phòng.
* Thông tin phòng bao gồm: Số phòng, Tầng, Loại phòng (Studio, 1PN, 2PN), Diện tích, Giá thuê gốc, Danh mục thiết bị đi kèm (Điều hòa, tủ lạnh, giường...).
* **Quản lý bộ sưu tập ảnh phòng**:
  * Khi thêm hoặc sửa phòng, Admin có thể nhập và lưu trữ **nhiều link ảnh** tham khảo cho một phòng.
  * Hỗ trợ giao diện thêm ảnh linh hoạt (nhập link URL và nhấn "Thêm"), xóa ảnh khỏi danh sách bằng cách chỉ chuột vào ảnh và bấm Xóa.
  * Có các nút chèn nhanh ảnh gợi ý chất lượng cao cho các loại phòng.
  * Hiển thị danh sách thumbnail các ảnh đã thêm ngay trong biểu mẫu để theo dõi trực quan.
* **Chi tiết phòng trên Trang chủ (Guest Room Details)**:
  * Khách truy cập Trang chủ có thể click vào bất kỳ thẻ phòng mẫu nào để mở **Modal Xem Chi Tiết Phòng**.
  * Modal hiển thị đầy đủ thông tin phòng kèm một **Bộ sưu tập slide ảnh (Gallery)** gồm toàn bộ các hình ảnh tham khảo đã được cấu hình.
  * Tích hợp nút **"Đặt Lịch Xem Phòng Này"** trong Modal để tự động điền mẫu đăng ký thông tin giữ chỗ và cuộn mượt mà tới phần biểu mẫu liên hệ bên dưới.

#### 3.3.2. Quản lý hợp đồng cho thuê (Contract Management)
* Khởi tạo hợp đồng mới khi có khách thuê: Liên kết thông tin Khách thuê (Họ tên, CCCD, SĐT, Email) với một phòng cụ thể.
* Cấu hình các điều khoản hợp đồng: Ngày bắt đầu, Ngày hết hạn, Số tiền cọc, Kỳ hạn thanh toán (hàng tháng/mỗi 3 tháng).
* Trạng thái hợp đồng: Đang hiệu lực, Sắp hết hạn (Cảnh báo trước 30 ngày), Đã thanh lý, Quá hạn.

#### 3.3.3. Trang lấy chỉ số Điện/Nước (Meter Reading Page)
* **Bố cục dạng bảng mật độ cao (High-density Grid)**:
  * Thiết kế giao diện nhập liệu dạng bảng ưu diện tích dọc, phù hợp cho quy mô trọ lớn (30-40 phòng).
  * Mỗi phòng là một dòng duy nhất hiển thị song song cả hai cột chỉ số Điện và Nước.
* **Bộ lọc và Tìm kiếm tức thời (Filter & Search)**:
  * Tích hợp thanh tìm kiếm thời gian thực để tìm phòng theo Số phòng hoặc Tên khách thuê.
  * Hệ thống các tab phân loại nhanh: "Tất cả", "Chưa ghi Điện", "Chưa ghi Nước", "Đã ghi xong".
* **Quy trình nhập liệu và an toàn dữ liệu**:
  * Tự động hiển thị **Chỉ số cũ** của kỳ trước để đối chiếu.
  * Bắt lỗi logic tức thời: Không cho phép lưu chỉ số mới nhỏ hơn chỉ số cũ.
  * **Tránh click đúp (Double-click protection)**: Khóa cứng nút lưu và ô nhập liệu trong thời gian gửi yêu cầu API lên máy chủ.

#### 3.3.4. Quản lý và Tự động tính Hóa đơn (Automatic Invoice Management)
* **Cơ chế kích hoạt tự động:** Ngay sau khi lưu chỉ số Điện/Nước thành công, hệ thống CMS tự động khởi tạo bản ghi Hóa đơn.
* **Công thức tự động tính toán hóa đơn (Invoice Calculation Logic):**
    $$\text{Tổng Hóa Đơn} = \text{Giá Phòng Cố Định} + (\text{Số Điện Tiêu Thụ} \times \text{Đơn Giá Điện}) + (\text{Số Nước Tiêu Thụ} \times \text{Đơn Giá Nước}) + \sum(\text{Phí Dịch Vụ Cố Định})$$
* **Gửi Email Hóa đơn tự động theo lịch (Scheduled Cron Job):**
  * Chạy ngầm định kỳ hàng tháng quét các hóa đơn ở trạng thái "Chờ gửi" (Draft) để tự động gửi thư tới email khách thuê (đã xác minh) vào ngày cố định.
* **Gửi lại Mail Hóa đơn Thủ công (On-Demand Resend Email)**:
  * Cho phép Admin click nút **"Gửi Mail" / "Gửi lại Mail"** trực tiếp tại hàng danh sách hóa đơn hoặc trong Modal chi tiết để gửi thư tức thì bất kỳ lúc nào.
  * **Bảo toàn trạng thái**: Thao tác gửi lại email cho các hóa đơn đã thanh toán hoặc nợ quá hạn sẽ chỉ gửi thư chứ không ghi đè trạng thái thanh toán gốc trong cơ sở dữ liệu.
* **Mẫu Email Hóa đơn Định dạng HTML Chuyên nghiệp**:
  * Email định dạng HTML chất lượng cao với dải màu gradient, bảng thống kê lượng tiêu thụ điện nước chi tiết (kèm chỉ số cũ/mới), tổng tiền cần thanh toán hiển thị nổi bật, và khung hướng dẫn chuyển khoản ngân hàng kèm hạn chót đóng tiền.
* **Quản lý Hóa đơn:**
    * Hỗ trợ xuất hóa đơn dưới dạng file PDF mẫu chuyên nghiệp để xem hoặc tải xuống độc lập.
    * Theo dõi trạng thái hóa đơn: *Chờ gửi*, *Đã gửi*, *Chưa thanh toán*, *Đã thanh toán một phần*, *Đã thanh toán xong*.

#### 3.3.5. Trang Master cấu hình Dịch vụ cố định (Master Settings Page)
* Nơi Admin cấu hình tất cả biến số/đơn giá nền tảng áp dụng chung cho toàn hệ thống hoặc tùy chỉnh riêng theo cụm phòng.
* Quản lý danh mục Dịch vụ cố định và Biến động:
    * Đơn giá Điện (VND/kWh).
    * Đơn giá Nước (VND/m³ hoặc VND/người).
    * Phí Internet/Wifi (VND/phòng hoặc VND/người).
    * Phí dịch vụ vận hành an ninh và PCCC (VND/tháng).
    * Phí vệ sinh, rác thải.
* Cơ chế linh hoạt: Cho phép bật/tắt (Active/Inactive) hoặc cập nhật đơn giá theo sự thay đổi của thị trường mà không làm ảnh hưởng đến dữ liệu hóa đơn mang tính lịch sử của các tháng cũ.

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

* **Bảo mật thông tin:** Mã hóa mật khẩu người dùng, bảo mật dữ liệu thông tin cá nhân (CCCD, Số điện thoại) của khách thuê. Phân quyền chặt chẽ (Chỉ Admin mới truy cập được CMS và Master Data).
* **Hiệu năng & Tính chính xác:** Phép tính tự động hóa đơn yêu cầu độ chính xác tuyệt đối (làm tròn số theo chuẩn tiền tệ VND). Thời gian xử lý tạo hóa đơn hàng loạt < 3 giây.
* **Độ tin cậy của dịch vụ Email:** Hệ thống gửi email (Mail Server / SMTP) cần được cấu hình chuẩn (SPF, DKIM) để đảm bảo tỷ lệ thư vào thẳng Inbox của khách hàng cao, tránh bị đánh dấu là Spam.
* **Sao lưu dữ liệu (Backup):** Hệ thống tự động sao lưu dữ liệu hóa đơn, hợp đồng định kỳ hàng tuần phòng trường hợp sự cố phần cứng.

### 3.3.6. Trang đăng ký tài khoản (User Registration Page)
* Cho phép người dùng đăng ký tài khoản Quản trị viên (Admin) mới thông qua giao diện công khai để đăng nhập hệ thống.
* Yêu cầu các trường: Tên đăng nhập (Username), Email, Mật khẩu (Password).
* Mật khẩu đăng ký bắt buộc phải được mã hóa trước khi lưu trữ vào cơ sở dữ liệu.

### 3.3.7. Trang quản lý người dùng (User Management Page)
* Tích hợp vào Bảng điều khiển Admin (Admin Dashboard).
* Cho phép Quản trị viên tối cao xem danh sách các tài khoản trong hệ thống, thực hiện chỉnh sửa phân quyền hoặc xóa bớt tài khoản khi không còn nhu cầu.

### 3.3.9. Phân hệ Khách thuê (Tenant Dashboard & Account Provisioning)
* **Tự động cấp tài khoản**: Khi Admin khởi tạo một Hợp đồng thành công, hệ thống sẽ tự động tạo một tài khoản người dùng (`User`) cho Khách thuê với vai trò là `tenant`. Tên đăng nhập chính là Email và mật khẩu mặc định là Số điện thoại của khách thuê.
* **Quy chế Đăng nhập Khách thuê**: Khách thuê chỉ có thể đăng nhập thành công vào hệ thống bằng Email và mật khẩu của họ sau khi đã bấm liên kết xác minh địa chỉ email được gửi tự động.
* **Trang thông tin Khách thuê**: Sau khi đăng nhập, khách thuê có giao diện riêng (Tenant Dashboard) để xem:
  * Chi tiết hợp đồng hiện tại (Ngày bắt đầu, kết thúc, tiền cọc).
  * Trạng thái và thông tin phòng (Diện tích, giá gốc, tiện nghi).
  * Lịch sử hóa đơn tiền phòng hàng tháng (Bao gồm chỉ số điện/nước đã chốt và trạng thái thanh toán: Bản nháp, Đã gửi, Chưa thanh toán, Đã thanh toán).
* **Giao diện trang chủ**: Tích hợp lại nút "Đăng nhập" trên Trang chủ (Homepage) dẫn tới trang đăng nhập chung. Khi người dùng đã đăng nhập, hệ thống sẽ tự động hiển thị tên tài khoản, vai trò và nút "Đăng xuất" kèm theo nút điều hướng tương ứng:
  * Vai trò `admin` hoặc `manager` ➞ Nút điều hướng dẫn tới trang quản trị `/admin`.
  * Vai trò `tenant` ➞ Nút điều hướng dẫn tới cổng thông tin khách thuê `/tenant`.

### 3.3.10. Cơ chế an toàn và nâng cấp Trải nghiệm người dùng (UX/UI Safeguards)
* **Chống Click Đúp (Double-click Protection)**:
  * Tất cả các nút bấm quan trọng gửi yêu cầu bất đồng bộ (Ký hợp đồng, Lưu phòng, Gửi lại email xác minh, Cập nhật bảng giá, Cập nhật trạng thái thanh toán hóa đơn) đều được tích hợp cơ chế chống click đúp.
  * Trong quá trình xử lý, các nút sẽ bị vô hiệu hóa (`disabled`) và hiển thị văn bản trạng thái tải (ví dụ: `Đang gửi...`, `Đang cập nhật...`).
  * Đối với các biểu mẫu phức tạp (Modal hợp đồng và phòng trọ), một lớp phủ bán trong suốt (`overlay`) và hiệu ứng xoay tròn (`spinner`) sẽ che phủ toàn bộ Modal để chặn tương tác chuột hoàn toàn cho đến khi nhận được phản hồi từ máy chủ.
* **Việt hóa trạng thái (Vietnamese Status Standardization)**:
  * Toàn bộ trạng thái động của hệ thống hiển thị tới người dùng đã được chuyển đổi sang tiếng Việt:
    * Trạng thái phòng: *Còn trống (Available), Đang thuê (Occupied), Bảo trì (Maintenance)*.
    * Trạng thái hợp đồng: *Đang hiệu lực (Active), Sắp hết hạn (Expiring), Đã thanh lý (Terminated), Quá hạn đóng tiền (Overdue)*.
    * Trạng thái hóa đơn: *Bản nháp (Draft), Đã gửi (Sent), Chưa thanh toán (Unpaid), Thanh toán một phần (Partially Paid), Đã thanh toán (Paid)*.
* **Mở rộng CRUD Hợp đồng**:
  * Cho phép chỉnh sửa thông tin hợp đồng hiện hữu trực tiếp thông qua biểu mẫu cập nhật. Khi sửa Email, trạng thái xác minh sẽ được reset và hệ thống tự động gửi Link email xác nhận mới.
  * Hỗ trợ thanh lý/xóa bỏ hợp đồng và tự động đồng bộ hóa trạng thái phòng trở về trống (`Available`) trong cơ sở dữ liệu.

