from pydantic import BaseModel, EmailStr, Field

from app.core.constants import Limits
from app.schemas.user import UserSchema


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=Limits.PASSWORD_MIN, max_length=Limits.PASSWORD_MAX)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema


class MessageResponse(BaseModel):
    """For endpoints whose only payload is a confirmation sentence."""

    message: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
