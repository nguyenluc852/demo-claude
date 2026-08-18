"""Dependencies shared across routers."""

from typing import Annotated

from fastapi import Depends, Query

from app.common.schemas import PaginationParams
from app.core.constants import Pagination


def pagination_params(
    page: int = Query(default=Pagination.DEFAULT_PAGE, ge=Pagination.DEFAULT_PAGE),
    size: int = Query(
        default=Pagination.DEFAULT_SIZE, ge=Pagination.MIN_SIZE, le=Pagination.MAX_SIZE
    ),
) -> PaginationParams:
    return PaginationParams(page=page, size=size)


PaginationDep = Annotated[PaginationParams, Depends(pagination_params)]
