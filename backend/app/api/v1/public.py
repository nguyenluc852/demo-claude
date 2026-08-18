"""The unauthenticated surface the marketing homepage talks to."""

from fastapi import APIRouter, status

from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import Pagination, Route, Tag
from app.core.messages import SuccessMessage
from app.schemas.auth import MessageResponse
from app.schemas.lead import LeadCreate
from app.schemas.room import PublicRoomSchema
from app.services.lead import lead_service
from app.services.room import room_service

router = APIRouter(tags=[Tag.PUBLIC])


@router.get(Route.PUBLIC_ROOMS, response_model=PageResponse[PublicRoomSchema])
async def public_rooms() -> PageResponse[PublicRoomSchema]:
    rooms = await room_service.list_public(Pagination.GRID_SIZE)
    return PageResponse(
        data=rooms,
        meta=PageMeta(
            page=Pagination.DEFAULT_PAGE, size=Pagination.GRID_SIZE, total=len(rooms)
        ),
    )


@router.post(
    Route.PUBLIC_LEADS,
    response_model=DataResponse[MessageResponse],
    status_code=status.HTTP_201_CREATED,
)
async def submit_lead(payload: LeadCreate) -> DataResponse[MessageResponse]:
    await lead_service.create(payload)
    return DataResponse(data=MessageResponse(message=SuccessMessage.LEAD_RECEIVED))
