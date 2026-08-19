"""User accounts: staff registration, tenant provisioning, and administration."""

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.common.documents import serialize, to_object_id
from app.common.exceptions import BadRequestError, ConflictError, NotFoundError
from app.common.security import generate_verification_token, hash_password
from app.core.constants import Collection, Field, UserRole
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.user import UserCreate, UserSchema, UserUpdate


class UserService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.USERS)

    async def get_by_email(self, email: str) -> dict[str, Any] | None:
        document: dict[str, Any] | None = await self._collection.find_one(
            {Field.EMAIL: email.lower()}
        )
        return document

    async def get(self, user_id: str) -> UserSchema:
        document = await self._collection.find_one(
            {Field.ID: to_object_id(user_id, ErrorMessage.USER_NOT_FOUND)}
        )
        if document is None:
            raise NotFoundError(ErrorMessage.USER_NOT_FOUND)
        return UserSchema.model_validate(serialize(document))

    async def list(self, offset: int, limit: int) -> tuple[list[UserSchema], int]:
        total: int = await self._collection.count_documents({})
        cursor = self._collection.find({}).sort(Field.CREATED_AT, -1).skip(offset).limit(limit)
        return [UserSchema.model_validate(serialize(doc)) async for doc in cursor], total

    async def _assert_unique(self, email: str, username: str) -> None:
        if await self._collection.find_one({Field.EMAIL: email.lower()}):
            raise ConflictError(ErrorMessage.EMAIL_TAKEN)
        if await self._collection.find_one({Field.USERNAME: username}):
            raise ConflictError(ErrorMessage.USERNAME_TAKEN)

    async def create_staff(self, payload: UserCreate, role: str = UserRole.ADMIN) -> UserSchema:
        """Self-service registration. Staff accounts skip email verification."""
        await self._assert_unique(payload.email, payload.username)
        document: dict[str, Any] = {
            Field.USERNAME: payload.username,
            Field.EMAIL: payload.email.lower(),
            Field.PASSWORD_HASH: hash_password(payload.password),
            Field.ROLE: role,
            "email_verified": True,
            "phone": None,
            Field.CONTRACT_ID: None,
            Field.CREATED_AT: datetime.now(UTC),
        }
        result = await self._collection.insert_one(document)
        document[Field.ID] = result.inserted_id
        return UserSchema.model_validate(serialize(document))

    async def provision_tenant(
        self, email: str, phone: str, contract_id: ObjectId
    ) -> str | None:
        """Create (or re-point) the tenant login that a new contract implies.

        Username is the email and the default password is the phone number, per
        the spec. Returns the verification token when a fresh email needs
        confirming, or None when the account already exists and is verified.
        """
        normalized = email.lower()
        token = generate_verification_token()
        existing = await self._collection.find_one({Field.EMAIL: normalized})

        if existing is not None:
            # Re-use the account, but re-attach it to the contract being signed.
            update: dict[str, Any] = {Field.CONTRACT_ID: str(contract_id), "phone": phone}
            if not existing.get("email_verified"):
                update[Field.VERIFICATION_TOKEN] = token
                await self._collection.update_one({Field.ID: existing[Field.ID]}, {"$set": update})
                return token
            await self._collection.update_one({Field.ID: existing[Field.ID]}, {"$set": update})
            return None

        username = await self._unique_username(normalized)
        await self._collection.insert_one(
            {
                Field.USERNAME: username,
                Field.EMAIL: normalized,
                Field.PASSWORD_HASH: hash_password(phone),
                Field.ROLE: UserRole.TENANT,
                "email_verified": False,
                Field.VERIFICATION_TOKEN: token,
                "phone": phone,
                Field.CONTRACT_ID: str(contract_id),
                Field.CREATED_AT: datetime.now(UTC),
            }
        )
        return token

    async def _unique_username(self, email: str) -> str:
        """Usernames are unique-indexed, so fall back to a suffix on collision."""
        candidate = email
        suffix = 1
        while await self._collection.find_one({Field.USERNAME: candidate}):
            candidate = f"{email}-{suffix}"
            suffix += 1
        return candidate

    async def reset_verification(self, email: str, contract_id: ObjectId) -> str:
        """Editing a contract's email invalidates the old confirmation."""
        token = generate_verification_token()
        await self._collection.update_one(
            {Field.EMAIL: email.lower()},
            {
                "$set": {
                    "email_verified": False,
                    Field.VERIFICATION_TOKEN: token,
                    Field.CONTRACT_ID: str(contract_id),
                }
            },
        )
        return token

    async def update(self, user_id: str, payload: UserUpdate) -> UserSchema:
        changes = payload.model_dump(exclude_none=True)
        if not changes:
            return await self.get(user_id)
        object_id = to_object_id(user_id, ErrorMessage.USER_NOT_FOUND)
        result = await self._collection.update_one({Field.ID: object_id}, {"$set": changes})
        if result.matched_count == 0:
            raise NotFoundError(ErrorMessage.USER_NOT_FOUND)
        return await self.get(user_id)

    async def delete(self, user_id: str, actor_id: str) -> None:
        if user_id == actor_id:
            raise BadRequestError(ErrorMessage.CANNOT_DELETE_SELF)
        result = await self._collection.delete_one(
            {Field.ID: to_object_id(user_id, ErrorMessage.USER_NOT_FOUND)}
        )
        if result.deleted_count == 0:
            raise NotFoundError(ErrorMessage.USER_NOT_FOUND)


user_service = UserService()
