from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.common.validators import one_of
from app.core.constants import Limits, UserRole


class UserBase(BaseModel):
    username: str = Field(min_length=Limits.USERNAME_MIN, max_length=Limits.USERNAME_MAX)
    email: EmailStr


class UserSchema(UserBase):
    """Public shape of a user — never carries the password hash."""

    id: str
    role: str
    email_verified: bool = False
    phone: str | None = None
    contract_id: str | None = None
    created_at: datetime


class UserCreate(UserBase):
    password: str = Field(min_length=Limits.PASSWORD_MIN, max_length=Limits.PASSWORD_MAX)


class UserUpdate(BaseModel):
    role: str | None = None
    email_verified: bool | None = None

    @field_validator("role")
    @classmethod
    def _valid_role(cls, value: str | None) -> str | None:
        return None if value is None else one_of(value, UserRole.ALL)
