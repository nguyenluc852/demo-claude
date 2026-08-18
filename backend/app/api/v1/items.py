from fastapi import APIRouter, status

from app.common.deps import PaginationDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import Route, Tag
from app.schemas.item import ItemCreate, ItemSchema, ItemUpdate
from app.services.item import item_service

router = APIRouter(tags=[Tag.ITEMS])


@router.get(Route.ITEMS, response_model=PageResponse[ItemSchema])
async def list_items(pagination: PaginationDep) -> PageResponse[ItemSchema]:
    items, total = item_service.list(pagination.offset, pagination.size)
    return PageResponse(
        data=items,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )


@router.get(Route.ITEM_DETAIL, response_model=DataResponse[ItemSchema])
async def get_item(item_id: int) -> DataResponse[ItemSchema]:
    return DataResponse(data=item_service.get(item_id))


@router.post(
    Route.ITEMS,
    response_model=DataResponse[ItemSchema],
    status_code=status.HTTP_201_CREATED,
)
async def create_item(payload: ItemCreate) -> DataResponse[ItemSchema]:
    return DataResponse(data=item_service.create(payload))


@router.patch(Route.ITEM_DETAIL, response_model=DataResponse[ItemSchema])
async def update_item(item_id: int, payload: ItemUpdate) -> DataResponse[ItemSchema]:
    return DataResponse(data=item_service.update(item_id, payload))


@router.delete(Route.ITEM_DETAIL, status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int) -> None:
    item_service.delete(item_id)
