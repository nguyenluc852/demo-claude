from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.common.validators import one_of
from app.core.constants import Limits, ServiceCategory, ServiceUnit


class ServiceBase(BaseModel):
    code: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.NAME_MAX)
    name: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.NAME_MAX)
    unit_price: float = Field(ge=0, le=Limits.MONEY_MAX)
    unit: str
    category: str
    active: bool = True

    @field_validator("unit")
    @classmethod
    def _valid_unit(cls, value: str) -> str:
        return one_of(value, ServiceUnit.ALL)

    @field_validator("category")
    @classmethod
    def _valid_category(cls, value: str) -> str:
        return one_of(value, ServiceCategory.ALL)


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=Limits.NAME_MIN, max_length=Limits.NAME_MAX)
    unit_price: float | None = Field(default=None, ge=0, le=Limits.MONEY_MAX)
    unit: str | None = None
    category: str | None = None
    active: bool | None = None

    @field_validator("unit")
    @classmethod
    def _valid_unit(cls, value: str | None) -> str | None:
        return None if value is None else one_of(value, ServiceUnit.ALL)

    @field_validator("category")
    @classmethod
    def _valid_category(cls, value: str | None) -> str | None:
        return None if value is None else one_of(value, ServiceCategory.ALL)


class ServiceSchema(ServiceBase):
    id: str
    created_at: datetime
