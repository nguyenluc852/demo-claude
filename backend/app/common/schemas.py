"""Response envelopes shared by every endpoint.

All routes return one of these, so clients parse a single predictable shape.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

from app.core.constants import Pagination

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    """Body of every 4xx/5xx response, emitted by the handlers in main.py."""

    error: ErrorDetail


class DataResponse(BaseModel, Generic[T]):
    """Single-resource success envelope."""

    data: T


class PageMeta(BaseModel):
    page: int
    size: int
    total: int


class PageResponse(BaseModel, Generic[T]):
    """List success envelope. Always paginated so responses stay bounded."""

    data: list[T]
    meta: PageMeta


class PaginationParams(BaseModel):
    page: int = Field(default=Pagination.DEFAULT_PAGE, ge=Pagination.DEFAULT_PAGE)
    size: int = Field(
        default=Pagination.DEFAULT_SIZE, ge=Pagination.MIN_SIZE, le=Pagination.MAX_SIZE
    )

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size
