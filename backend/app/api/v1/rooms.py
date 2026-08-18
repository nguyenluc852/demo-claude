from fastapi import APIRouter, Query, status

from app.common.deps import PaginationDep, StaffDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import Pagination, QueryParam, Route, Tag
from app.schemas.room import RoomCreate, RoomGridItem, RoomSchema, RoomUpdate
from app.services.room import room_service

router = APIRouter(tags=[Tag.ROOMS])


# Declared before the detail route so "grid" is not captured as a room id.
@router.get(Route.ROOMS_GRID, response_model=PageResponse[RoomGridItem])
async def room_grid(_: StaffDep) -> PageResponse[RoomGridItem]:
    """The colour-coded board on the dashboard, capped at one property's worth."""
    items = await room_service.grid(Pagination.GRID_SIZE)
    return PageResponse(
        data=items,
        meta=PageMeta(
            page=Pagination.DEFAULT_PAGE, size=Pagination.GRID_SIZE, total=len(items)
        ),
    )


@router.get(Route.ROOMS, response_model=PageResponse[RoomSchema])
async def list_rooms(
    pagination: PaginationDep,
    _: StaffDep,
    status_filter: str | None = Query(default=None, alias=QueryParam.STATUS),
    search: str | None = Query(default=None, alias=QueryParam.SEARCH),
) -> PageResponse[RoomSchema]:
    rooms, total = await room_service.list(
        pagination.offset, pagination.size, status_filter, search
    )
    return PageResponse(
        data=rooms,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )


@router.get(Route.ROOM_DETAIL, response_model=DataResponse[RoomSchema])
async def get_room(room_id: str, _: StaffDep) -> DataResponse[RoomSchema]:
    return DataResponse(data=await room_service.get(room_id))


@router.post(
    Route.ROOMS, response_model=DataResponse[RoomSchema], status_code=status.HTTP_201_CREATED
)
async def create_room(payload: RoomCreate, _: StaffDep) -> DataResponse[RoomSchema]:
    return DataResponse(data=await room_service.create(payload))


@router.patch(Route.ROOM_DETAIL, response_model=DataResponse[RoomSchema])
async def update_room(
    room_id: str, payload: RoomUpdate, _: StaffDep
) -> DataResponse[RoomSchema]:
    return DataResponse(data=await room_service.update(room_id, payload))


@router.delete(Route.ROOM_DETAIL, status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: str, _: StaffDep) -> None:
    await room_service.delete(room_id)
