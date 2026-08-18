"""Invoice PDF rendering.

ReportLab's built-in fonts are Latin-1 only, so the labels here are the
unaccented forms in PdfText — tenant names and room numbers still render as
supplied, and anything outside the encodable range degrades rather than raising.
"""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.constants import ServiceCode
from app.core.messages import EmailTemplate, PdfText
from app.schemas.invoice import InvoiceSchema

_HEADER_BG = colors.HexColor("#0f766e")
_HEADER_FG = colors.white
_GRID = colors.HexColor("#cbd5e1")
_TOTAL_BG = colors.HexColor("#ecfeff")
_FONT = "Helvetica"
_FONT_BOLD = "Helvetica-Bold"


def _ascii(value: str) -> str:
    """Drop characters the base-14 fonts cannot encode instead of failing."""
    return value.encode("latin-1", errors="ignore").decode("latin-1")


def _money(amount: float) -> str:
    return f"{amount:,.0f}"


def _number(value: float | None) -> str:
    return "-" if value is None else f"{value:,.0f}"


def render_invoice_pdf(invoice: InvoiceSchema) -> bytes:
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=_ascii(PdfText.TITLE),
    )
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    title_style.fontName = _FONT_BOLD
    body_style = styles["Normal"]
    body_style.fontName = _FONT

    meta_rows = [
        [f"{PdfText.ROOM_LABEL}:", _ascii(invoice.room_number or "-")],
        [f"{PdfText.PERIOD_LABEL}:", invoice.period],
        [f"{PdfText.TENANT_LABEL}:", _ascii(invoice.tenant_name or "-")],
        [f"{PdfText.ISSUED_LABEL}:", invoice.created_at.strftime("%d/%m/%Y")],
    ]
    meta_table = Table(meta_rows, colWidths=[35 * mm, None])
    meta_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), _FONT_BOLD),
                ("FONTNAME", (1, 0), (1, -1), _FONT),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    headers = [
        _ascii(EmailTemplate.COL_DESCRIPTION),
        _ascii(EmailTemplate.COL_OLD),
        _ascii(EmailTemplate.COL_NEW),
        _ascii(EmailTemplate.COL_USAGE),
        _ascii(EmailTemplate.COL_UNIT_PRICE),
        _ascii(EmailTemplate.COL_AMOUNT),
    ]
    rows: list[list[str]] = [
        headers,
        [
            _ascii(EmailTemplate.ROW_RENT),
            "-",
            "-",
            "1",
            _money(invoice.room_charge),
            _money(invoice.room_charge),
        ],
    ]
    for line in invoice.lines:
        is_metered = line.code in (ServiceCode.ELECTRICITY, ServiceCode.WATER)
        rows.append(
            [
                _ascii(line.name),
                _number(line.meter_old) if is_metered else "-",
                _number(line.meter_new) if is_metered else "-",
                _number(line.quantity),
                _money(line.unit_price),
                _money(line.amount),
            ]
        )
    rows.append([_ascii(PdfText.TOTAL_LABEL), "", "", "", "", _money(invoice.total)])

    table = Table(rows, colWidths=[52 * mm, 22 * mm, 22 * mm, 22 * mm, 26 * mm, 30 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), _HEADER_BG),
                ("TEXTCOLOR", (0, 0), (-1, 0), _HEADER_FG),
                ("FONTNAME", (0, 0), (-1, 0), _FONT_BOLD),
                ("FONTNAME", (0, 1), (-1, -2), _FONT),
                ("FONTNAME", (0, -1), (-1, -1), _FONT_BOLD),
                ("BACKGROUND", (0, -1), (-1, -1), _TOTAL_BG),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, _GRID),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    document.build(
        [
            Paragraph(_ascii(PdfText.TITLE), title_style),
            Spacer(1, 6 * mm),
            meta_table,
            Spacer(1, 6 * mm),
            table,
        ]
    )
    return buffer.getvalue()


def invoice_filename(invoice: InvoiceSchema) -> str:
    return PdfText.FILENAME.format(
        room_number=_ascii(invoice.room_number or "room"), period=invoice.period
    )
