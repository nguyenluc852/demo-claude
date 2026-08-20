"""Every human-readable string returned by the API.

Routes and services must reference these constants, never inline text.
"""

from typing import Final


class ErrorCode:
    NOT_FOUND: Final = "NOT_FOUND"
    VALIDATION_ERROR: Final = "VALIDATION_ERROR"
    CONFLICT: Final = "CONFLICT"
    INTERNAL_ERROR: Final = "INTERNAL_ERROR"
    UNAUTHORIZED: Final = "UNAUTHORIZED"
    FORBIDDEN: Final = "FORBIDDEN"
    BAD_REQUEST: Final = "BAD_REQUEST"
    EMAIL_FAILED: Final = "EMAIL_FAILED"


class ErrorMessage:
    ITEM_NOT_FOUND: Final = "Item not found"
    ITEM_NAME_TAKEN: Final = "An item with this name already exists"
    VALIDATION_FAILED: Final = "Request validation failed"
    INTERNAL_ERROR: Final = "An unexpected error occurred"

    # Auth
    INVALID_CREDENTIALS: Final = "Email hoặc mật khẩu không đúng"
    EMAIL_TAKEN: Final = "Email này đã được đăng ký"
    USERNAME_TAKEN: Final = "Tên đăng nhập này đã tồn tại"
    NOT_AUTHENTICATED: Final = "Bạn cần đăng nhập để tiếp tục"
    INVALID_TOKEN: Final = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
    FORBIDDEN: Final = "Bạn không có quyền thực hiện thao tác này"
    EMAIL_NOT_VERIFIED: Final = "Email chưa được xác minh. Vui lòng kiểm tra hộp thư."
    INVALID_VERIFICATION_TOKEN: Final = "Liên kết xác minh không hợp lệ hoặc đã được dùng"
    USER_NOT_FOUND: Final = "Không tìm thấy tài khoản"
    CANNOT_DELETE_SELF: Final = "Không thể xóa tài khoản đang đăng nhập"
    INVALID_CRON_SECRET: Final = "Khóa lập lịch không hợp lệ"
    EMAIL_SEND_FAILED: Final = "Không gửi được email. Vui lòng thử lại sau."

    # Rooms
    ROOM_NOT_FOUND: Final = "Không tìm thấy phòng"
    ROOM_NUMBER_TAKEN: Final = "Số phòng này đã tồn tại"
    ROOM_HAS_ACTIVE_CONTRACT: Final = "Phòng đang có hợp đồng hiệu lực, không thể xóa"

    # Contracts
    CONTRACT_NOT_FOUND: Final = "Không tìm thấy hợp đồng"
    ROOM_ALREADY_OCCUPIED: Final = "Phòng này đã có hợp đồng đang hiệu lực"
    CONTRACT_END_BEFORE_START: Final = "Ngày hết hạn phải sau ngày bắt đầu"

    # Meter readings
    METER_NOT_FOUND: Final = "Không tìm thấy chỉ số của kỳ này"
    METER_BELOW_PREVIOUS: Final = "Chỉ số mới không được nhỏ hơn chỉ số cũ"
    METER_NO_ACTIVE_CONTRACT: Final = "Phòng chưa có hợp đồng hiệu lực để ghi chỉ số"

    # Invoices
    INVOICE_NOT_FOUND: Final = "Không tìm thấy hóa đơn"
    INVOICE_ALREADY_EXISTS: Final = "Hóa đơn của kỳ này đã tồn tại"
    INVOICE_NO_EMAIL: Final = "Hợp đồng chưa có email khách thuê để gửi hóa đơn"
    PAYMENT_EXCEEDS_TOTAL: Final = "Số tiền thanh toán vượt quá tổng hóa đơn"
    PAYMENT_NEGATIVE: Final = "Số tiền thanh toán không hợp lệ"

    # Services / master data
    SERVICE_NOT_FOUND: Final = "Không tìm thấy dịch vụ"
    SERVICE_CODE_TAKEN: Final = "Mã dịch vụ này đã tồn tại"
    SERVICE_PRICE_MISSING: Final = "Chưa cấu hình đơn giá cho dịch vụ này"

    # Leads
    LEAD_NOT_FOUND: Final = "Không tìm thấy yêu cầu tư vấn"

    # Tenant portal
    TENANT_NO_CONTRACT: Final = "Tài khoản của bạn chưa được gắn với hợp đồng nào"


class SuccessMessage:
    ITEM_CREATED: Final = "Item created"
    ITEM_DELETED: Final = "Item deleted"
    EMAIL_VERIFIED: Final = "Email đã được xác minh. Bạn có thể đăng nhập."
    VERIFICATION_SENT: Final = "Đã gửi lại email xác minh"
    INVOICE_SENT: Final = "Đã gửi hóa đơn tới email khách thuê"
    LEAD_RECEIVED: Final = "Đã nhận thông tin. Chúng tôi sẽ liên hệ với bạn sớm nhất."


class HealthStatus:
    OK: Final = "ok"


class EmailTemplate:
    """Subjects and body copy for outbound mail."""

    INVOICE_SUBJECT: Final = "[Nhà trọ] Hóa đơn phòng {room_number} — kỳ {period}"
    VERIFY_SUBJECT: Final = "[Nhà trọ] Xác minh địa chỉ email của bạn"

    VERIFY_HEADING: Final = "Xác minh địa chỉ email"
    VERIFY_SUBTITLE: Final = "Một bước cuối trước khi bạn đăng nhập"
    VERIFY_INTRO: Final = (
        "Tài khoản khách thuê của bạn đã được khởi tạo. "
        "Vui lòng bấm nút bên dưới để xác minh email và đăng nhập hệ thống."
    )
    VERIFY_ACTION: Final = "Xác minh email"
    VERIFY_CREDENTIALS_NOTE: Final = (
        "Tên đăng nhập là email này, mật khẩu mặc định là số điện thoại bạn đã đăng ký."
    )

    INVOICE_HEADING: Final = "Hóa đơn tiền phòng"
    INVOICE_GREETING: Final = "Kính gửi {tenant_name},"
    INVOICE_INTRO: Final = (
        "Dưới đây là chi tiết hóa đơn phòng {room_number} cho kỳ {period}."
    )
    # The headline number is what to transfer, which is not the invoice total
    # whenever anything was already paid or carried over from an earlier period.
    INVOICE_AMOUNT_DUE_LABEL: Final = "Số tiền cần chuyển khoản"
    INVOICE_TOTAL_LABEL: Final = "Tổng hóa đơn kỳ này"
    INVOICE_PAID_LABEL: Final = "Đã thanh toán"
    INVOICE_PREVIOUS_DUE_LABEL: Final = "Còn nợ các kỳ trước"
    INVOICE_CARRY_OVER_NOTE: Final = (
        "Số tiền cần chuyển khoản đã bao gồm phần chưa thanh toán của các kỳ trước."
    )
    INVOICE_DUE_LABEL: Final = "Hạn thanh toán"
    INVOICE_BANK_HEADING: Final = "Thông tin chuyển khoản"
    # Shown to the tenant, so it belongs here rather than in the service that
    # formats it. `{room_number}` and `{period}` become the transfer reference.
    INVOICE_BANK_LINES: Final = (
        "Ngân hàng: Vietcombank — Chi nhánh Hà Nội",
        "Số tài khoản: 0123456789",
        "Chủ tài khoản: BAN QUAN LY NHA TRO",
        "Nội dung: {room_number} {period}",
    )
    INVOICE_FOOTER: Final = (
        "Email được gửi tự động từ hệ thống quản lý nhà trọ. Vui lòng không trả lời email này."
    )

    COL_DESCRIPTION: Final = "Khoản mục"
    COL_AMOUNT: Final = "Thành tiền"
    # The PDF prints on A4 and has the width for a full six-column breakdown;
    # the email does not, so only these four are print-only.
    COL_OLD: Final = "Chỉ số cũ"
    COL_NEW: Final = "Chỉ số mới"
    COL_USAGE: Final = "Tiêu thụ"
    COL_UNIT_PRICE: Final = "Đơn giá"
    # The arithmetic behind a line, folded under its name so the table stays two
    # columns wide — a phone cannot scroll an email sideways.
    WORK_METERED: Final = "{old} → {new} · {usage} {unit} × {price}"
    WORK_FIXED: Final = "{quantity} × {price}"
    WORK_RENT: Final = "Giá thuê cố định theo hợp đồng"

    ROW_RENT: Final = "Tiền phòng"
    ROW_ELECTRICITY: Final = "Tiền điện"
    ROW_WATER: Final = "Tiền nước"

    CURRENCY_SUFFIX: Final = "đ"


class PdfText:
    """Static copy rendered into the invoice PDF."""

    TITLE: Final = "HOA DON TIEN PHONG"
    ROOM_LABEL: Final = "Phong"
    PERIOD_LABEL: Final = "Ky"
    TENANT_LABEL: Final = "Khach thue"
    ISSUED_LABEL: Final = "Ngay xuat"
    TOTAL_LABEL: Final = "TONG HOA DON KY NAY"
    PAID_LABEL: Final = "DA THANH TOAN"
    PREVIOUS_DUE_LABEL: Final = "CON NO KY TRUOC"
    AMOUNT_DUE_LABEL: Final = "CAN THANH TOAN"
    FILENAME: Final = "invoice-{room_number}-{period}.pdf"
