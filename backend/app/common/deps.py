"""Dependencies shared across routers: pagination and the authenticated caller."""

import secrets
from typing import Annotated, Any

from fastapi import Depends, Header, Query

from app.common.documents import serialize, to_object_id
from app.common.exceptions import ForbiddenError, UnauthorizedError
from app.common.schemas import PaginationParams
from app.common.security import decode_access_token
from app.core.config import settings
from app.core.constants import (
    AuthScheme,
    Collection,
    Field,
    Pagination,
    UserRole,
)
from app.core.constants import (
    Header as HeaderName,
)
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.user import UserSchema


def pagination_params(
    page: int = Query(default=Pagination.DEFAULT_PAGE, ge=Pagination.DEFAULT_PAGE),
    size: int = Query(
        default=Pagination.DEFAULT_SIZE, ge=Pagination.MIN_SIZE, le=Pagination.MAX_SIZE
    ),
) -> PaginationParams:
    return PaginationParams(page=page, size=size)


PaginationDep = Annotated[PaginationParams, Depends(pagination_params)]


def _bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise UnauthorizedError()
    scheme, _, token = authorization.partition(" ")
    if scheme != AuthScheme.BEARER or not token:
        raise UnauthorizedError()
    return token


async def current_user(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> UserSchema:
    """Resolve the caller from the bearer token, re-reading the row every request.

    Re-reading means a role change or a deletion takes effect immediately rather
    than at the token's expiry.
    """
    payload = decode_access_token(_bearer_token(authorization))
    subject = payload.get(AuthScheme.SUBJECT_CLAIM)
    if not isinstance(subject, str):
        raise UnauthorizedError(ErrorMessage.INVALID_TOKEN)

    document: dict[str, Any] | None = await get_collection(Collection.USERS).find_one(
        {Field.ID: to_object_id(subject, ErrorMessage.INVALID_TOKEN)}
    )
    if document is None:
        raise UnauthorizedError(ErrorMessage.INVALID_TOKEN)
    return UserSchema.model_validate(serialize(document))


CurrentUserDep = Annotated[UserSchema, Depends(current_user)]


async def require_staff(user: CurrentUserDep) -> UserSchema:
    """Admin and manager only — the whole CMS sits behind this."""
    if user.role not in UserRole.STAFF:
        raise ForbiddenError()
    return user


StaffDep = Annotated[UserSchema, Depends(require_staff)]


async def require_admin(user: CurrentUserDep) -> UserSchema:
    """Reserved for account administration, which a manager must not reach."""
    if user.role != UserRole.ADMIN:
        raise ForbiddenError()
    return user


AdminDep = Annotated[UserSchema, Depends(require_admin)]


async def require_tenant(user: CurrentUserDep) -> UserSchema:
    if user.role != UserRole.TENANT:
        raise ForbiddenError()
    return user


TenantDep = Annotated[UserSchema, Depends(require_tenant)]


async def require_cron_secret(
    cron_secret: Annotated[str | None, Header(alias=HeaderName.CRON_SECRET)] = None,
) -> None:
    """Guard the machine-to-machine dispatch endpoint.

    Not a `UserRole`: the caller is an external scheduler, not a person, so it
    gets its own narrow credential rather than a staff account's token.

    Fails closed. An unset `CRON_SECRET` rejects every request, so forgetting
    the environment variable can never leave the endpoint standing open.
    """
    if not settings.cron_secret:
        raise ForbiddenError(ErrorMessage.INVALID_CRON_SECRET)
    if cron_secret is None or not secrets.compare_digest(
        cron_secret, settings.cron_secret
    ):
        raise ForbiddenError(ErrorMessage.INVALID_CRON_SECRET)


CronDep = Annotated[None, Depends(require_cron_secret)]
