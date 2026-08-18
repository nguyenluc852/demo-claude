from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.common.validators import one_of
from app.core.constants import LeadStatus, Limits


class LeadCreate(BaseModel):
    name: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.NAME_MAX)
    phone: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.PHONE_MAX)
    email: EmailStr | None = None
    message: str | None = Field(default=None, max_length=Limits.TEXT_MAX)
    room_id: str | None = None


class LeadUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def _valid_status(cls, value: str) -> str:
        return one_of(value, LeadStatus.ALL)


class LeadSchema(BaseModel):
    id: str
    name: str
    phone: str
    email: str | None
    message: str | None
    room_id: str | None
    room_number: str | None = None
    status: str
    created_at: datetime
