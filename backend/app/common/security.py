"""Password hashing and JWT encoding.

Kept apart from the auth service so routes, deps, and the contract service can
all reach it without importing each other.
"""

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.common.exceptions import UnauthorizedError
from app.core.config import settings
from app.core.constants import AuthScheme, Business
from app.core.messages import ErrorMessage


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:
        # A malformed hash must read as "wrong password", never as a 500.
        return False


def create_access_token(subject: str, role: str) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload: dict[str, Any] = {
        AuthScheme.SUBJECT_CLAIM: subject,
        AuthScheme.ROLE_CLAIM: role,
        AuthScheme.EXPIRY_CLAIM: expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=AuthScheme.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        decoded: dict[str, Any] = jwt.decode(
            token, settings.jwt_secret, algorithms=[AuthScheme.JWT_ALGORITHM]
        )
    except jwt.PyJWTError as exc:
        raise UnauthorizedError(ErrorMessage.INVALID_TOKEN) from exc
    return decoded


def generate_verification_token() -> str:
    return secrets.token_urlsafe(Business.VERIFICATION_TOKEN_BYTES)
