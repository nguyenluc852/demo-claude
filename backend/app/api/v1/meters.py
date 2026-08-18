from fastapi import APIRouter, Query

from app.common.deps import StaffDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import MeterFilter, Pagination, QueryParam, Route, Tag
from app.schemas.meter import MeterReadingSave, MeterRow
from app.services.meter import meter_service

router = APIRouter(tags=[Tag.METERS])


@router.get(Route.METERS, response_model=PageResponse[MeterRow])
async def meter_grid(
    _: StaffDep,
    period: str | None = Query(default=None, alias=QueryParam.PERIOD),
    tab: str = Query(default=MeterFilter.ALL, alias=QueryParam.FILTER),
    search: str = Query(default="", alias=QueryParam.SEARCH),
) -> PageResponse[MeterRow]:
    """One row per occupied room. Bounded by the room grid cap, not by paging."""
    rows = await meter_service.grid(period, tab, search)
    return PageResponse(
        data=rows,
        meta=PageMeta(
            page=Pagination.DEFAULT_PAGE, size=Pagination.GRID_SIZE, total=len(rows)
        ),
    )


@router.put(Route.METER_DETAIL, response_model=DataResponse[MeterRow])
async def save_reading(
    room_id: str, payload: MeterReadingSave, _: StaffDep
) -> DataResponse[MeterRow]:
    return DataResponse(data=await meter_service.save(room_id, payload))
