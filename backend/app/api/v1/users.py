from fastapi import APIRouter, status

from app.common.deps import AdminDep, PaginationDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import Route, Tag
from app.schemas.user import UserSchema, UserUpdate
from app.services.user import user_service

router = APIRouter(tags=[Tag.USERS])


@router.get(Route.USERS, response_model=PageResponse[UserSchema])
async def list_users(pagination: PaginationDep, _: AdminDep) -> PageResponse[UserSchema]:
    users, total = await user_service.list(pagination.offset, pagination.size)
    return PageResponse(
        data=users,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )


@router.patch(Route.USER_DETAIL, response_model=DataResponse[UserSchema])
async def update_user(
    user_id: str, payload: UserUpdate, _: AdminDep
) -> DataResponse[UserSchema]:
    return DataResponse(data=await user_service.update(user_id, payload))


@router.delete(Route.USER_DETAIL, status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, actor: AdminDep) -> None:
    await user_service.delete(user_id, actor.id)
