from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.common.validators import one_of
from app.core.constants import Limits, RoomStatus, RoomType


class RoomBase(BaseModel):
    room_number: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.ROOM_NUMBER_MAX)
    floor: int = Field(ge=Limits.FLOOR_MIN, le=Limits.FLOOR_MAX)
    room_type: str
    area: float = Field(gt=0, le=Limits.AREA_MAX)
    base_price: float = Field(ge=0, le=Limits.MONEY_MAX)
    amenities: list[str] = Field(default_factory=list, max_length=Limits.MAX_AMENITIES)
    images: list[str] = Field(default_factory=list, max_length=Limits.MAX_IMAGES)
    description: str | None = Field(default=None, max_length=Limits.TEXT_MAX)

    @field_validator("room_type")
    @classmethod
    def _valid_type(cls, value: str) -> str:
        return one_of(value, RoomType.ALL)


class RoomCreate(RoomBase):
    status: str = RoomStatus.AVAILABLE

    @field_validator("status")
    @classmethod
    def _valid_status(cls, value: str) -> str:
        return one_of(value, RoomStatus.ALL)


class RoomUpdate(BaseModel):
    room_number: str | None = Field(
        default=None, min_length=Limits.NAME_MIN, max_length=Limits.ROOM_NUMBER_MAX
    )
    floor: int | None = Field(default=None, ge=Limits.FLOOR_MIN, le=Limits.FLOOR_MAX)
    room_type: str | None = None
    area: float | None = Field(default=None, gt=0, le=Limits.AREA_MAX)
    base_price: float | None = Field(default=None, ge=0, le=Limits.MONEY_MAX)
    amenities: list[str] | None = Field(default=None, max_length=Limits.MAX_AMENITIES)
    images: list[str] | None = Field(default=None, max_length=Limits.MAX_IMAGES)
    description: str | None = Field(default=None, max_length=Limits.TEXT_MAX)
    status: str | None = None

    @field_validator("room_type")
    @classmethod
    def _valid_type(cls, value: str | None) -> str | None:
        return None if value is None else one_of(value, RoomType.ALL)

    @field_validator("status")
    @classmethod
    def _valid_status(cls, value: str | None) -> str | None:
        return None if value is None else one_of(value, RoomStatus.ALL)


class RoomSchema(RoomBase):
    id: str
    status: str
    created_at: datetime


class RoomOccupancy(BaseModel):
    """The quick-look payload behind a click on the dashboard room grid."""

    tenant_name: str | None = None
    contract_id: str | None = None
    contract_end: datetime | None = None


class RoomGridItem(RoomSchema):
    occupancy: RoomOccupancy = Field(default_factory=RoomOccupancy)


class PublicRoomSchema(BaseModel):
    """Homepage view of a room — no operational fields leak to visitors."""

    id: str
    room_number: str
    floor: int
    room_type: str
    area: float
    base_price: float
    amenities: list[str]
    images: list[str]
    description: str | None
    status: str
