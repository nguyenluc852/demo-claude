"""What the invoice email and the invoice PDF actually say about arrears.

Nothing here touches the database or the network: both renderers are pure
functions of an invoice plus its settlement, so the cases build both by hand.

The PDF is asserted through `_summary_rows` rather than through the finished
bytes — ReportLab compresses the content stream, so the labels are not findable
in the output. `render_invoice_pdf` is still exercised, for the one thing the
bytes can prove: that it builds at all.
"""

from datetime import UTC, datetime

from app.core.constants import InvoiceStatus, ServiceCode, ServiceUnit
from app.core.messages import EmailTemplate, PdfText
from app.schemas.invoice import InvoiceLine, InvoiceSchema, InvoiceSettlement
from app.services.email import render_invoice_email
from app.services.pdf import _summary_rows, render_invoice_pdf

ROOM_CHARGE = 3_000_000.0
ELECTRIC_AMOUNT = 875_000.0
TOTAL = ROOM_CHARGE + ELECTRIC_AMOUNT
PART_PAYMENT = 1_200_000.0
PREVIOUS_DUE = 2_400_000.0

PDF_MAGIC = b"%PDF-"
# Every template placeholder opens with this, so its absence proves none leaked.
PLACEHOLDER_MARKER = "{"
LABEL_COLUMN = 0


def _money(amount: float) -> str:
    """The same shape the email prints, spelled from the constant."""
    return f"{amount:,.0f}{EmailTemplate.CURRENCY_SUFFIX}"


def _invoice() -> InvoiceSchema:
    return InvoiceSchema(
        id="6a8697eaac0cb310611df81b",
        room_id="6a8697eaac0cb310611df81c",
        room_number="301",
        contract_id="6a8697eaac0cb310611df81d",
        tenant_name="Nguyen Van A",
        tenant_email="tenant@example.com",
        period="2026-08",
        room_charge=ROOM_CHARGE,
        lines=[
            InvoiceLine(
                code=ServiceCode.ELECTRICITY,
                name=EmailTemplate.ROW_ELECTRICITY,
                unit=ServiceUnit.PER_KWH,
                unit_price=3_500.0,
                quantity=250.0,
                amount=ELECTRIC_AMOUNT,
                meter_old=100.0,
                meter_new=350.0,
            )
        ],
        total=TOTAL,
        paid_amount=0.0,
        status=InvoiceStatus.UNPAID,
        due_date=datetime(2026, 9, 5, tzinfo=UTC),
        sent_at=None,
        created_at=datetime(2026, 8, 20, tzinfo=UTC),
    )


def _settlement(paid_amount: float = 0.0, previous_due: float = 0.0) -> InvoiceSettlement:
    invoice_due = TOTAL - paid_amount
    return InvoiceSettlement(
        invoice_total=TOTAL,
        paid_amount=paid_amount,
        invoice_due=invoice_due,
        previous_due=previous_due,
        amount_due=invoice_due + previous_due,
    )


def test_email_spells_out_the_arrears_it_is_adding_on() -> None:
    """The transfer is bigger than the invoice, so the mail has to say why."""
    settlement = _settlement(previous_due=PREVIOUS_DUE)

    html = render_invoice_email(_invoice(), settlement)

    assert EmailTemplate.INVOICE_PREVIOUS_DUE_LABEL in html
    assert EmailTemplate.INVOICE_AMOUNT_DUE_LABEL in html
    assert EmailTemplate.INVOICE_CARRY_OVER_NOTE in html
    assert EmailTemplate.INVOICE_TOTAL_LABEL in html
    assert _money(PREVIOUS_DUE) in html
    assert _money(settlement.amount_due) in html
    assert settlement.amount_due == TOTAL + PREVIOUS_DUE


def test_email_stays_plain_when_there_is_nothing_carried_over() -> None:
    """With nothing paid and nothing owed the breakdown would restate the total."""
    settlement = _settlement()

    html = render_invoice_email(_invoice(), settlement)

    assert EmailTemplate.INVOICE_PREVIOUS_DUE_LABEL not in html
    assert EmailTemplate.INVOICE_CARRY_OVER_NOTE not in html
    assert EmailTemplate.INVOICE_PAID_LABEL not in html
    assert EmailTemplate.INVOICE_TOTAL_LABEL not in html
    assert EmailTemplate.INVOICE_AMOUNT_DUE_LABEL in html
    assert _money(TOTAL) in html


def test_email_names_the_part_payment_even_with_no_arrears() -> None:
    """The other half of the problem: a partly paid invoice whose mail still
    asks for the full amount tells the tenant to pay twice."""
    settlement = _settlement(paid_amount=PART_PAYMENT)

    html = render_invoice_email(_invoice(), settlement)

    assert EmailTemplate.INVOICE_PAID_LABEL in html
    assert EmailTemplate.INVOICE_TOTAL_LABEL in html
    assert _money(PART_PAYMENT) in html
    assert _money(TOTAL - PART_PAYMENT) in html
    assert EmailTemplate.INVOICE_PREVIOUS_DUE_LABEL not in html
    assert EmailTemplate.INVOICE_CARRY_OVER_NOTE not in html


def test_pdf_summary_ends_on_the_amount_to_transfer() -> None:
    """The table style bolds and shades row -1, so the last row has to be the
    number the tenant transfers, not the invoice total above it."""
    settlement = _settlement(paid_amount=PART_PAYMENT, previous_due=PREVIOUS_DUE)

    rows = _summary_rows(settlement)
    labels = [row[LABEL_COLUMN] for row in rows]

    assert PdfText.PREVIOUS_DUE_LABEL in labels
    assert PdfText.PAID_LABEL in labels
    assert labels[0] == PdfText.TOTAL_LABEL
    assert labels[-1] == PdfText.AMOUNT_DUE_LABEL


def test_pdf_summary_is_one_row_when_nothing_is_carried_over() -> None:
    rows = _summary_rows(_settlement())

    assert len(rows) == 1
    assert rows[0][LABEL_COLUMN] == PdfText.TOTAL_LABEL


def test_pdf_builds_with_and_without_arrears() -> None:
    settled = _settlement()
    in_arrears = _settlement(paid_amount=PART_PAYMENT, previous_due=PREVIOUS_DUE)

    for settlement in (settled, in_arrears):
        assert render_invoice_pdf(_invoice(), settlement).startswith(PDF_MAGIC)


def test_email_carries_the_bank_details_with_the_transfer_reference() -> None:
    """The reference line is how a transfer is matched back to a room and a
    period; formatted wrong, the money lands with nothing identifying it.
    """
    invoice = _invoice()

    html = render_invoice_email(invoice, _settlement())

    assert EmailTemplate.INVOICE_BANK_HEADING in html
    for line in EmailTemplate.INVOICE_BANK_LINES:
        assert line.format(room_number=invoice.room_number, period=invoice.period) in html
    # No placeholder survives the formatting, whatever the lines end up saying.
    assert PLACEHOLDER_MARKER not in html
    assert invoice.room_number is not None
    assert f"{invoice.room_number} {invoice.period}" in html
