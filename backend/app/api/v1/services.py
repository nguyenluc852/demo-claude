from fastapi import APIRouter, status

from app.common.deps import PaginationDep, StaffDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import Route, Tag
from app.schemas.service import ServiceCreate, ServiceSchema, ServiceUpdate
from app.services.service_setting import service_setting_service

router = APIRouter(tags=[Tag.SERVICES])


@router.get(Route.SERVICES, response_model=PageResponse[ServiceSchema])
async def list_services(
    pagination: PaginationDep, _: StaffDep
) -> PageResponse[ServiceSchema]:
    services, total = await service_setting_service.list(pagination.offset, pagination.size)
    return PageResponse(
        data=services,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )


@router.post(
    Route.SERVICES,
    response_model=DataResponse[ServiceSchema],
    status_code=status.HTTP_201_CREATED,
)
async def create_service(payload: ServiceCreate, _: StaffDep) -> DataResponse[ServiceSchema]:
    return DataResponse(data=await service_setting_service.create(payload))


@router.patch(Route.SERVICE_DETAIL, response_model=DataResponse[ServiceSchema])
async def update_service(
    service_id: str, payload: ServiceUpdate, _: StaffDep
) -> DataResponse[ServiceSchema]:
    return DataResponse(data=await service_setting_service.update(service_id, payload))


@router.delete(Route.SERVICE_DETAIL, status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: str, _: StaffDep) -> None:
    await service_setting_service.delete(service_id)
