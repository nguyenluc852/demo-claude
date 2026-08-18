"""Enquiries submitted from the public homepage contact form."""

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.common.documents import serialize, to_object_id
from app.common.exceptions import NotFoundError
from app.core.constants import Collection, Field, LeadStatus
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.lead import LeadCreate, LeadSchema, LeadUpdate


class LeadService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.LEADS)

    async def _decorate(self, document: dict[str, Any]) -> LeadSchema:
        data = serialize(document)
        room_id = data.get(Field.ROOM_ID)
        if room_id:
            room = await get_collection(Collection.ROOMS).find_one(
                {Field.ID: ObjectId(str(room_id))}
            )
            data[Field.ROOM_NUMBER] = room.get(Field.ROOM_NUMBER) if room else None
        return LeadSchema.model_validate(data)

    async def create(self, payload: LeadCreate) -> LeadSchema:
        document: dict[str, Any] = {
            **payload.model_dump(),
            "email": payload.email.lower() if payload.email else None,
            Field.STATUS: LeadStatus.NEW,
            Field.CREATED_AT: datetime.now(UTC),
        }
        result = await self._collection.insert_one(document)
        document[Field.ID] = result.inserted_id
        return await self._decorate(document)

    async def list(
        self, offset: int, limit: int, status: str | None = None
    ) -> tuple[list[LeadSchema], int]:
        query: dict[str, Any] = {Field.STATUS: status} if status else {}
        total: int = await self._collection.count_documents(query)
        cursor = self._collection.find(query).sort(Field.CREATED_AT, -1).skip(offset).limit(limit)
        return [await self._decorate(doc) async for doc in cursor], total

    async def update(self, lead_id: str, payload: LeadUpdate) -> LeadSchema:
        object_id = to_object_id(lead_id, ErrorMessage.LEAD_NOT_FOUND)
        result = await self._collection.update_one(
            {Field.ID: object_id}, {"$set": payload.model_dump()}
        )
        if result.matched_count == 0:
            raise NotFoundError(ErrorMessage.LEAD_NOT_FOUND)
        document = await self._collection.find_one({Field.ID: object_id})
        if document is None:
            raise NotFoundError(ErrorMessage.LEAD_NOT_FOUND)
        return await self._decorate(document)

    async def delete(self, lead_id: str) -> None:
        result = await self._collection.delete_one(
            {Field.ID: to_object_id(lead_id, ErrorMessage.LEAD_NOT_FOUND)}
        )
        if result.deleted_count == 0:
            raise NotFoundError(ErrorMessage.LEAD_NOT_FOUND)


lead_service = LeadService()
