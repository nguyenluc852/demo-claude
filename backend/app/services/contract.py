"""Leases.

Signing a contract is the event that provisions the tenant's login and flips the
room to occupied; terminating one hands the room back to the available pool.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId

from app.common.documents import serialize, to_object_id
from app.common.exceptions import ConflictError, NotFoundError
from app.core.constants import Business, Collection, ContractStatus, Field, RoomStatus
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.contract import ContractCreate, ContractSchema, ContractUpdate
from app.services.auth import send_verification_email
from app.services.room import room_service
from app.services.user import user_service

_LIVE_STATUSES = (ContractStatus.ACTIVE, ContractStatus.EXPIRING, ContractStatus.OVERDUE)


def derive_status(current: str, end_date: datetime) -> str:
    """Expiry is a function of the clock, so it is recomputed rather than stored."""
    if current == ContractStatus.TERMINATED:
        return current
    now = datetime.now(UTC)
    deadline = end_date if end_date.tzinfo else end_date.replace(tzinfo=UTC)
    if deadline <= now:
        return ContractStatus.OVERDUE
    if deadline - now <= timedelta(days=Business.EXPIRING_WINDOW_DAYS):
        return ContractStatus.EXPIRING
    return current if current == ContractStatus.OVERDUE else ContractStatus.ACTIVE


class ContractService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.CONTRACTS)

    async def _decorate(self, document: dict[str, Any]) -> ContractSchema:
        """Attach the room number and the freshly derived status."""
        data = serialize(document)
        data[Field.STATUS] = derive_status(str(data[Field.STATUS]), data["end_date"])
        room = await get_collection(Collection.ROOMS).find_one(
            {Field.ID: ObjectId(str(data[Field.ROOM_ID]))}
        )
        data[Field.ROOM_NUMBER] = room.get(Field.ROOM_NUMBER) if room else None

        account = await user_service.get_by_email(str(data["tenant_email"]))
        data["email_verified"] = bool(account and account.get("email_verified"))
        return ContractSchema.model_validate(data)

    async def list(
        self, offset: int, limit: int, status: str | None = None
    ) -> tuple[list[ContractSchema], int]:
        query: dict[str, Any] = {Field.STATUS: status} if status else {}
        total: int = await self._collection.count_documents(query)
        cursor = self._collection.find(query).sort(Field.CREATED_AT, -1).skip(offset).limit(limit)
        return [await self._decorate(doc) async for doc in cursor], total

    async def get(self, contract_id: str) -> ContractSchema:
        return await self._decorate(await self.get_document(contract_id))

    async def get_document(self, contract_id: str) -> dict[str, Any]:
        document: dict[str, Any] | None = await self._collection.find_one(
            {Field.ID: to_object_id(contract_id, ErrorMessage.CONTRACT_NOT_FOUND)}
        )
        if document is None:
            raise NotFoundError(ErrorMessage.CONTRACT_NOT_FOUND)
        return document

    async def active_for_room(self, room_id: str) -> dict[str, Any] | None:
        document: dict[str, Any] | None = await self._collection.find_one(
            {Field.ROOM_ID: room_id, Field.STATUS: {"$in": _LIVE_STATUSES}}
        )
        return document

    async def create(self, payload: ContractCreate) -> ContractSchema:
        await room_service.get_document(payload.room_id)  # 404s on an unknown room
        if await self.active_for_room(payload.room_id) is not None:
            raise ConflictError(ErrorMessage.ROOM_ALREADY_OCCUPIED)

        document: dict[str, Any] = {
            **payload.model_dump(),
            "tenant_email": payload.tenant_email.lower(),
            Field.STATUS: ContractStatus.ACTIVE,
            Field.CREATED_AT: datetime.now(UTC),
        }
        result = await self._collection.insert_one(document)
        document[Field.ID] = result.inserted_id

        await room_service.set_status(
            ObjectId(payload.room_id), RoomStatus.OCCUPIED
        )

        token = await user_service.provision_tenant(
            email=payload.tenant_email,
            phone=payload.tenant_phone,
            contract_id=result.inserted_id,
        )
        if token:
            await send_verification_email(payload.tenant_email, token)

        return await self._decorate(document)

    async def update(self, contract_id: str, payload: ContractUpdate) -> ContractSchema:
        existing = await self.get_document(contract_id)
        changes = payload.model_dump(exclude_none=True)

        new_email = changes.get("tenant_email")
        if new_email:
            changes["tenant_email"] = str(new_email).lower()

        if changes:
            await self._collection.update_one(
                {Field.ID: existing[Field.ID]}, {"$set": changes}
            )

        # A changed address is unproven until the new owner clicks the link.
        if new_email and str(new_email).lower() != str(existing["tenant_email"]).lower():
            token = await user_service.provision_tenant(
                email=str(new_email),
                phone=str(changes.get("tenant_phone", existing["tenant_phone"])),
                contract_id=existing[Field.ID],
            ) or await user_service.reset_verification(str(new_email), existing[Field.ID])
            await send_verification_email(str(new_email), token)

        if changes.get(Field.STATUS) == ContractStatus.TERMINATED:
            await room_service.set_status(
                ObjectId(str(existing[Field.ROOM_ID])), RoomStatus.AVAILABLE
            )

        return await self.get(contract_id)

    async def delete(self, contract_id: str) -> None:
        existing = await self.get_document(contract_id)
        await self._collection.delete_one({Field.ID: existing[Field.ID]})
        # The room must not stay marked occupied by a contract that no longer exists.
        await room_service.set_status(
            ObjectId(str(existing[Field.ROOM_ID])), RoomStatus.AVAILABLE
        )


contract_service = ContractService()
