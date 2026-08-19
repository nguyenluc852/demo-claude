from fastapi import APIRouter, Query, Response

from app.common.deps import CronDep, PaginationDep, StaffDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import Header, MediaType, QueryParam, Route, Tag
from app.schemas.invoice import (
    InvoiceDispatchResult,
    InvoicePayment,
    InvoiceSchema,
    InvoiceStatusUpdate,
)
from app.services.invoice import invoice_service
from app.services.pdf import invoice_filename, render_invoice_pdf

router = APIRouter(tags=[Tag.INVOICES])


@router.get(Route.INVOICES, response_model=PageResponse[InvoiceSchema])
async def list_invoices(
    pagination: PaginationDep,
    _: StaffDep,
    status_filter: str | None = Query(default=None, alias=QueryParam.STATUS),
    period: str | None = Query(default=None, alias=QueryParam.PERIOD),
) -> PageResponse[InvoiceSchema]:
    invoices, total = await invoice_service.list(
        pagination.offset, pagination.size, status_filter, period
    )
    return PageResponse(
        data=invoices,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )


@router.get(Route.INVOICE_DETAIL, response_model=DataResponse[InvoiceSchema])
async def get_invoice(invoice_id: str, _: StaffDep) -> DataResponse[InvoiceSchema]:
    return DataResponse(data=await invoice_service.get(invoice_id))


@router.post(Route.INVOICE_DISPATCH, response_model=DataResponse[InvoiceDispatchResult])
async def dispatch_invoices(_: CronDep) -> DataResponse[InvoiceDispatchResult]:
    """Mail every draft invoice. The monthly job, reachable over HTTP.

    Same call the in-process scheduler makes, so an external cron can drive the
    monthly run where the process does not stay alive long enough to hold one.
    Safe to call twice: sending moves an invoice out of draft, so a second run
    finds nothing left to send.
    """
    return DataResponse(data=await invoice_service.send_pending())


@router.post(Route.INVOICE_SEND, response_model=DataResponse[InvoiceSchema])
async def send_invoice(invoice_id: str, _: StaffDep) -> DataResponse[InvoiceSchema]:
    """Send or resend. A resend leaves an existing payment state untouched."""
    return DataResponse(data=await invoice_service.send(invoice_id))


@router.patch(Route.INVOICE_PAYMENT, response_model=DataResponse[InvoiceSchema])
async def record_payment(
    invoice_id: str, payload: InvoicePayment, _: StaffDep
) -> DataResponse[InvoiceSchema]:
    return DataResponse(
        data=await invoice_service.record_payment(invoice_id, payload.paid_amount)
    )


@router.patch(Route.INVOICE_DETAIL, response_model=DataResponse[InvoiceSchema])
async def update_status(
    invoice_id: str, payload: InvoiceStatusUpdate, _: StaffDep
) -> DataResponse[InvoiceSchema]:
    return DataResponse(data=await invoice_service.set_status(invoice_id, payload.status))


@router.get(Route.INVOICE_PDF)
async def download_pdf(invoice_id: str, _: StaffDep) -> Response:
    invoice = await invoice_service.get(invoice_id)
    return Response(
        content=render_invoice_pdf(invoice),
        media_type=MediaType.PDF,
        headers={
            Header.CONTENT_DISPOSITION: Header.ATTACHMENT_TEMPLATE.format(
                name=invoice_filename(invoice)
            )
        },
    )
