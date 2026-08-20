"""The tenant's own view: their contract, their room, their invoice history."""

from fastapi import APIRouter

from app.common.deps import PaginationDep, TenantDep
from app.common.exceptions import NotFoundError
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import InvoiceStatus, Route, Tag
from app.core.messages import ErrorMessage
from app.schemas.invoice import InvoiceSchema
from app.schemas.tenant import TenantOverview
from app.services.contract import contract_service
from app.services.invoice import invoice_service
from app.services.room import room_service

router = APIRouter(tags=[Tag.TENANT])


def _contract_id(user_contract_id: str | None) -> str:
    if not user_contract_id:
        raise NotFoundError(ErrorMessage.TENANT_NO_CONTRACT)
    return user_contract_id


@router.get(Route.TENANT_ME, response_model=DataResponse[TenantOverview])
async def my_overview(user: TenantDep) -> DataResponse[TenantOverview]:
    contract = await contract_service.get(_contract_id(user.contract_id))
    room = await room_service.get(contract.room_id)
    return DataResponse(data=TenantOverview(contract=contract, room=room))


@router.get(Route.TENANT_INVOICES, response_model=PageResponse[InvoiceSchema])
async def my_invoices(
    pagination: PaginationDep, user: TenantDep
) -> PageResponse[InvoiceSchema]:
    invoices, total = await invoice_service.list(
        pagination.offset,
        pagination.size,
        contract_id=_contract_id(user.contract_id),
        statuses=InvoiceStatus.TENANT_VISIBLE,
    )
    return PageResponse(
        data=invoices,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )
