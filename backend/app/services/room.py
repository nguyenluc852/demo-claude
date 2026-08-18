"""Room catalogue: CRUD, the dashboard grid, and the public homepage list."""

import re
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.common.documents import serialize, to_object_id
from app.common.exceptions import ConflictError, NotFoundError
from app.core.constants import Collection, ContractStatus, Field, RoomStatus
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.room import (
    PublicRoomSchema,
    RoomCreate,
    RoomGridItem,
    RoomOccupancy,
    RoomSchema,
    RoomUpdate,
)

# `list` is a method on this service, and inside a class body that name shadows
# the builtin for every annotation written after it. These aliases spell the
# return types out here, where `list` still means the builtin.
RoomPage = tuple[list[RoomSchema], int]
GridItems = list[RoomGridItem]
PublicRooms = list[PublicRoomSchema]


class RoomService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.ROOMS)

    @staticmethod
    def _query(status: str | None, search: str | None) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if status:
            query[Field.STATUS] = status
        if search:
            query[Field.ROOM_NUMBER] = {"$regex": re.escape(search), "$options": "i"}
        return query

    async def list(
        self, offset: int, limit: int, status: str | None = None, search: str | None = None
    ) -> RoomPage:
        query = self._query(status, search)
        total: int = await self._collection.count_documents(query)
        cursor = (
            self._collection.find(query)
            .sort([(Field.FLOOR, 1), (Field.ROOM_NUMBER, 1)])
            .skip(offset)
            .limit(limit)
        )
        return [RoomSchema.model_validate(serialize(doc)) async for doc in cursor], total

    async def grid(self, limit: int) -> GridItems:
        """Rooms plus the tenant currently in them, for the colour-coded board."""
        cursor = self._collection.find({}).sort([(Field.FLOOR, 1), (Field.ROOM_NUMBER, 1)]).limit(
            limit
        )
        rooms = [serialize(doc) async for doc in cursor]

        contracts = get_collection(Collection.CONTRACTS)
        active_cursor = contracts.find(
            {Field.STATUS: {"$in": [ContractStatus.ACTIVE, ContractStatus.EXPIRING,
                                    ContractStatus.OVERDUE]}}
        )
        by_room: dict[str, dict[str, Any]] = {}
        async for contract in active_cursor:
            by_room[str(contract[Field.ROOM_ID])] = contract

        items: GridItems = []
        for room in rooms:
            contract = by_room.get(room["id"])
            occupancy = (
                RoomOccupancy(
                    tenant_name=contract.get("tenant_name"),
                    contract_id=str(contract[Field.ID]),
                    contract_end=contract.get("end_date"),
                )
                if contract
                else RoomOccupancy()
            )
            items.append(RoomGridItem.model_validate({**room, "occupancy": occupancy}))
        return items

    async def list_public(self, limit: int) -> PublicRooms:
        cursor = self._collection.find(
            {Field.STATUS: {"$ne": RoomStatus.MAINTENANCE}}
        ).sort([(Field.FLOOR, 1), (Field.ROOM_NUMBER, 1)]).limit(limit)
        return [PublicRoomSchema.model_validate(serialize(doc)) async for doc in cursor]

    async def get(self, room_id: str) -> RoomSchema:
        return RoomSchema.model_validate(serialize(await self.get_document(room_id)))

    async def get_document(self, room_id: str) -> dict[str, Any]:
        document: dict[str, Any] | None = await self._collection.find_one(
            {Field.ID: to_object_id(room_id, ErrorMessage.ROOM_NOT_FOUND)}
        )
        if document is None:
            raise NotFoundError(ErrorMessage.ROOM_NOT_FOUND)
        return document

    async def create(self, payload: RoomCreate) -> RoomSchema:
        if await self._collection.find_one({Field.ROOM_NUMBER: payload.room_number}):
            raise ConflictError(ErrorMessage.ROOM_NUMBER_TAKEN)
        document: dict[str, Any] = {
            **payload.model_dump(),
            Field.CREATED_AT: datetime.now(UTC),
        }
        result = await self._collection.insert_one(document)
        document[Field.ID] = result.inserted_id
        return RoomSchema.model_validate(serialize(document))

    async def update(self, room_id: str, payload: RoomUpdate) -> RoomSchema:
        object_id = to_object_id(room_id, ErrorMessage.ROOM_NOT_FOUND)
        changes = payload.model_dump(exclude_none=True)

        new_number = changes.get(Field.ROOM_NUMBER)
        if new_number and await self._collection.find_one(
            {Field.ROOM_NUMBER: new_number, Field.ID: {"$ne": object_id}}
        ):
            raise ConflictError(ErrorMessage.ROOM_NUMBER_TAKEN)

        if changes:
            result = await self._collection.update_one({Field.ID: object_id}, {"$set": changes})
            if result.matched_count == 0:
                raise NotFoundError(ErrorMessage.ROOM_NOT_FOUND)
        return await self.get(room_id)

    async def delete(self, room_id: str) -> None:
        object_id = to_object_id(room_id, ErrorMessage.ROOM_NOT_FOUND)
        occupied = await get_collection(Collection.CONTRACTS).find_one(
            {
                Field.ROOM_ID: room_id,
                Field.STATUS: {"$ne": ContractStatus.TERMINATED},
            }
        )
        if occupied is not None:
            raise ConflictError(ErrorMessage.ROOM_HAS_ACTIVE_CONTRACT)

        result = await self._collection.delete_one({Field.ID: object_id})
        if result.deleted_count == 0:
            raise NotFoundError(ErrorMessage.ROOM_NOT_FOUND)

    async def set_status(self, room_id: ObjectId, status: str) -> None:
        await self._collection.update_one({Field.ID: room_id}, {"$set": {Field.STATUS: status}})


room_service = RoomService()
