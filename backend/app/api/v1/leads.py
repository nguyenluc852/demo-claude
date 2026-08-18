from fastapi import APIRouter, Query, status

from app.common.deps import PaginationDep, StaffDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import QueryParam, Route, Tag
from app.schemas.lead import LeadSchema, LeadUpdate
from app.services.lead import lead_service

router = APIRouter(tags=[Tag.LEADS])


@router.get(Route.LEADS, response_model=PageResponse[LeadSchema])
async def list_leads(
    pagination: PaginationDep,
    _: StaffDep,
    status_filter: str | None = Query(default=None, alias=QueryParam.STATUS),
) -> PageResponse[LeadSchema]:
    leads, total = await lead_service.list(pagination.offset, pagination.size, status_filter)
    return PageResponse(
        data=leads,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )


@router.patch(Route.LEAD_DETAIL, response_model=DataResponse[LeadSchema])
async def update_lead(
    lead_id: str, payload: LeadUpdate, _: StaffDep
) -> DataResponse[LeadSchema]:
    return DataResponse(data=await lead_service.update(lead_id, payload))


@router.delete(Route.LEAD_DETAIL, status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(lead_id: str, _: StaffDep) -> None:
    await lead_service.delete(lead_id)
