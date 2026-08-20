"""Outbound mail: the HTML invoice and the tenant verification link.

Delivery goes through the Resend HTTP API. With no API key configured the
mailer logs the message instead of sending it, so a dev machine needs no mail
account to exercise the flows that trigger email.
"""

import logging

import httpx

from app.common.exceptions import EmailDeliveryError
from app.core.config import settings
from app.core.constants import AuthScheme, Header, Resend, ServiceCode
from app.core.messages import EmailTemplate
from app.schemas.invoice import InvoiceLine, InvoiceSchema, InvoiceSettlement

logger = logging.getLogger(__name__)

_STYLE_PAGE = (
    "margin:0;padding:24px;background:#f1f5f9;"
    "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;"
)
_STYLE_CARD = (
    "max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;"
    "overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.12);"
)
_STYLE_HEADER = (
    "padding:28px 32px;color:#ffffff;"
    "background:linear-gradient(135deg,#0f766e 0%,#0891b2 55%,#6366f1 100%);"
)
_STYLE_BODY = "padding:28px 32px;"
_STYLE_TABLE = "width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;"
_STYLE_TH = (
    "text-align:left;padding:10px 12px;background:#f1f5f9;"
    "border-bottom:2px solid #e2e8f0;font-weight:600;"
)
_STYLE_TD = "padding:10px 12px;border-bottom:1px solid #e2e8f0;"
_STYLE_TD_NUM = _STYLE_TD + "text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;"
_STYLE_WORK = "color:#64748b;font-size:12px;margin-top:3px;font-variant-numeric:tabular-nums;"
_STYLE_TOTAL = (
    "margin:20px 0;padding:18px 20px;border-radius:12px;background:#ecfeff;"
    "border:1px solid #a5f3fc;"
)
_STYLE_BANK = (
    "margin-top:20px;padding:16px 20px;border-radius:12px;"
    "background:#fffbeb;border:1px solid #fde68a;font-size:14px;"
)
_STYLE_BUTTON = (
    "display:inline-block;padding:13px 26px;border-radius:10px;background:#0891b2;"
    "color:#ffffff;text-decoration:none;font-weight:600;"
)
_STYLE_FOOTER = "padding:18px 32px;background:#f8fafc;color:#64748b;font-size:12px;"

def _money(amount: float) -> str:
    return f"{amount:,.0f}{EmailTemplate.CURRENCY_SUFFIX}"


def _number(value: float | None) -> str:
    return "—" if value is None else f"{value:,.0f}"


async def send_email(to: str, subject: str, html_body: str) -> None:
    """Deliver one message, or log it when no mail credential is configured."""
    if not settings.email_enabled:
        # Name the missing half. Guessing which one is unset costs a deploy cycle.
        missing = "RESEND_API_KEY" if not settings.resend_api_key else "EMAIL_FROM"
        logger.info(
            "Email disabled (%s not set) — message to %s not sent. Subject: %s",
            missing,
            to,
            subject,
        )
        logger.debug("Body:\n%s", html_body)
        return

    payload = {
        Resend.FIELD_FROM: settings.email_from,
        Resend.FIELD_TO: [to],
        Resend.FIELD_SUBJECT: subject,
        Resend.FIELD_HTML: html_body,
    }
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {settings.resend_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=Resend.TIMEOUT_SECONDS) as client:
            response = await client.post(Resend.API_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        # Network-level failure. The key lives in a header, so nothing secret
        # reaches the log here.
        logger.error("Mail provider unreachable for %s: %s", to, exc)
        raise EmailDeliveryError from exc

    if response.is_error:
        logger.error(
            "Mail provider rejected the message to %s: %s %s",
            to,
            response.status_code,
            response.text,
        )
        raise EmailDeliveryError


def _shell(header_title: str, header_subtitle: str, body: str) -> str:
    return (
        f'<div style="{_STYLE_PAGE}"><div style="{_STYLE_CARD}">'
        f'<div style="{_STYLE_HEADER}">'
        f'<div style="font-size:22px;font-weight:700;">{header_title}</div>'
        f'<div style="opacity:.9;margin-top:6px;">{header_subtitle}</div>'
        f"</div>"
        f'<div style="{_STYLE_BODY}">{body}</div>'
        f'<div style="{_STYLE_FOOTER}">{EmailTemplate.INVOICE_FOOTER}</div>'
        f"</div></div>"
    )


def render_verification_email(verify_url: str) -> str:
    body = (
        f"<p>{EmailTemplate.VERIFY_INTRO}</p>"
        f'<p style="margin:24px 0;">'
        f'<a href="{verify_url}" style="{_STYLE_BUTTON}">{EmailTemplate.VERIFY_ACTION}</a>'
        f"</p>"
        f'<p style="color:#475569;font-size:14px;">'
        f"{EmailTemplate.VERIFY_CREDENTIALS_NOTE}</p>"
    )
    # The subtitle is display copy, never the URL: the link belongs to the
    # button alone, so the token does not sit in the open on screen.
    return _shell(
        EmailTemplate.VERIFY_HEADING, EmailTemplate.VERIFY_SUBTITLE, body
    )


def _work(line: InvoiceLine) -> str:
    """The arithmetic behind one line, in words."""
    is_metered = line.code in (ServiceCode.ELECTRICITY, ServiceCode.WATER)
    if is_metered:
        return EmailTemplate.WORK_METERED.format(
            old=_number(line.meter_old),
            new=_number(line.meter_new),
            usage=_number(line.quantity),
            unit=line.unit,
            price=_money(line.unit_price),
        )
    return EmailTemplate.WORK_FIXED.format(
        quantity=_number(line.quantity), price=_money(line.unit_price)
    )


def _row(name: str, work: str, amount: float) -> str:
    """Two columns, never six: a phone cannot scroll an email sideways, so the
    readings and the unit price fold under the name instead of beside it."""
    return (
        f'<tr><td style="{_STYLE_TD}">'
        f'<div style="font-weight:600;">{name}</div>'
        f'<div style="{_STYLE_WORK}">{work}</div></td>'
        f'<td style="{_STYLE_TD_NUM}"><b>{_money(amount)}</b></td></tr>'
    )


def _meter_rows(invoice: InvoiceSchema) -> str:
    rows = [
        _row(EmailTemplate.ROW_RENT, EmailTemplate.WORK_RENT, invoice.room_charge)
    ]
    rows.extend(_row(line.name, _work(line), line.amount) for line in invoice.lines)
    return "".join(rows)


def _settlement_rows(settlement: InvoiceSettlement) -> str:
    """The breakdown above the headline, shown only when it says something.

    With nothing paid and nothing carried over the headline already equals the
    invoice total, so the rows would just restate it.
    """
    if settlement.previous_due <= 0 and settlement.paid_amount <= 0:
        return ""

    rows = [(EmailTemplate.INVOICE_TOTAL_LABEL, settlement.invoice_total)]
    if settlement.paid_amount > 0:
        rows.append((EmailTemplate.INVOICE_PAID_LABEL, settlement.paid_amount))
    if settlement.previous_due > 0:
        rows.append((EmailTemplate.INVOICE_PREVIOUS_DUE_LABEL, settlement.previous_due))

    cells = "".join(
        f'<tr><td style="{_STYLE_TD}">{label}</td>'
        f'<td style="{_STYLE_TD_NUM}">{_money(amount)}</td></tr>'
        for label, amount in rows
    )
    note = (
        f'<div style="{_STYLE_WORK}">{EmailTemplate.INVOICE_CARRY_OVER_NOTE}</div>'
        if settlement.previous_due > 0
        else ""
    )
    return f'<table style="{_STYLE_TABLE}"><tbody>{cells}</tbody></table>{note}'


def render_invoice_email(invoice: InvoiceSchema, settlement: InvoiceSettlement) -> str:
    headers = "".join(
        f'<th style="{_STYLE_TH}">{label}</th>'
        for label in (EmailTemplate.COL_DESCRIPTION, EmailTemplate.COL_AMOUNT)
    )
    room_number = invoice.room_number or ""
    bank = "<br>".join(
        line.format(room_number=room_number, period=invoice.period)
        for line in EmailTemplate.INVOICE_BANK_LINES
    )

    subtitle = EmailTemplate.INVOICE_INTRO.format(
        room_number=room_number, period=invoice.period
    )
    body = (
        f"<p>{EmailTemplate.INVOICE_GREETING.format(tenant_name=invoice.tenant_name or '')}</p>"
        f"<p>{subtitle}</p>"
        f'<table style="{_STYLE_TABLE}"><thead><tr>{headers}</tr></thead>'
        f"<tbody>{_meter_rows(invoice)}</tbody></table>"
        f"{_settlement_rows(settlement)}"
        f'<div style="{_STYLE_TOTAL}">'
        f'<div style="color:#0e7490;font-size:13px;">'
        f"{EmailTemplate.INVOICE_AMOUNT_DUE_LABEL}</div>"
        f'<div style="font-size:28px;font-weight:800;color:#0f172a;">'
        f"{_money(settlement.amount_due)}</div>"
        f'<div style="color:#475569;font-size:13px;margin-top:6px;">'
        f"{EmailTemplate.INVOICE_DUE_LABEL}: {invoice.due_date:%d/%m/%Y}</div>"
        f"</div>"
        f'<div style="{_STYLE_BANK}">'
        f'<div style="font-weight:700;margin-bottom:8px;">'
        f"{EmailTemplate.INVOICE_BANK_HEADING}</div>{bank}</div>"
    )
    return _shell(EmailTemplate.INVOICE_HEADING, subtitle, body)
