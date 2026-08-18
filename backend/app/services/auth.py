"""Login, self-service registration, and email verification."""

from typing import Any
from urllib.parse import urlencode

from app.common.documents import serialize
from app.common.exceptions import BadRequestError, UnauthorizedError
from app.common.security import create_access_token, verify_password
from app.core.config import settings
from app.core.constants import Collection, Field, QueryParam, UserRole
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserSchema
from app.services.email import render_verification_email, send_email
from app.services.user import user_service

_VERIFY_PATH = "/verify-email"


def build_verification_url(token: str) -> str:
    query = urlencode({QueryParam.TOKEN: token})
    return f"{settings.public_base_url}{_VERIFY_PATH}?{query}"


async def send_verification_email(email: str, token: str) -> None:
    from app.core.messages import EmailTemplate

    await send_email(
        email,
        EmailTemplate.VERIFY_SUBJECT,
        render_verification_email(build_verification_url(token)),
    )


class AuthService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.USERS)

    async def register(self, payload: UserCreate) -> TokenResponse:
        """Public registration creates an admin, per the spec's registration page."""
        user = await user_service.create_staff(payload, role=UserRole.ADMIN)
        return self._token_for(user)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        document = await user_service.get_by_email(payload.email)
        if document is None or not verify_password(
            payload.password, str(document.get("password_hash", ""))
        ):
            raise UnauthorizedError(ErrorMessage.INVALID_CREDENTIALS)

        # Tenants are provisioned by the office, so their address must be proven
        # before the account can be used. Staff accounts are trusted at creation.
        if document.get(Field.ROLE) == UserRole.TENANT and not document.get("email_verified"):
            raise UnauthorizedError(ErrorMessage.EMAIL_NOT_VERIFIED)

        return self._token_for(UserSchema.model_validate(serialize(document)))

    async def verify_email(self, token: str) -> None:
        result = await self._collection.update_one(
            {Field.VERIFICATION_TOKEN: token},
            {"$set": {"email_verified": True}, "$unset": {Field.VERIFICATION_TOKEN: ""}},
        )
        if result.matched_count == 0:
            raise BadRequestError(ErrorMessage.INVALID_VERIFICATION_TOKEN)

    async def resend_verification(self, email: str) -> None:
        document = await user_service.get_by_email(email)
        if document is None:
            raise BadRequestError(ErrorMessage.USER_NOT_FOUND)
        if document.get("email_verified"):
            raise BadRequestError(ErrorMessage.INVALID_VERIFICATION_TOKEN)

        token = str(document.get(Field.VERIFICATION_TOKEN) or "")
        if not token:
            from app.common.security import generate_verification_token

            token = generate_verification_token()
            await self._collection.update_one(
                {Field.ID: document[Field.ID]}, {"$set": {Field.VERIFICATION_TOKEN: token}}
            )
        await send_verification_email(str(document[Field.EMAIL]), token)

    def _token_for(self, user: UserSchema) -> TokenResponse:
        from app.core.constants import AuthScheme

        return TokenResponse(
            access_token=create_access_token(user.id, user.role),
            token_type=AuthScheme.BEARER,
            user=user,
        )


auth_service = AuthService()
