"""Master data: the unit prices every invoice is calculated from.

Prices are read at invoice time and copied onto the invoice line, so changing a
price here never rewrites an invoice that was already issued.
"""

from datetime import UTC, datetime
from typing import Any

from app.common.documents import serialize, to_object_id
from app.common.exceptions import ConflictError, NotFoundError
from app.core.constants import (
    Collection,
    Field,
    ServiceCategory,
    ServiceCode,
    ServiceUnit,
)
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.service import ServiceCreate, ServiceSchema, ServiceUpdate

DEFAULT_SERVICES: tuple[dict[str, Any], ...] = (
    {
        Field.CODE: ServiceCode.ELECTRICITY,
        "name": "Tiền điện",
        "unit_price": 3500.0,
        "unit": ServiceUnit.PER_KWH,
        "category": ServiceCategory.METERED,
        "active": True,
    },
    {
        Field.CODE: ServiceCode.WATER,
        "name": "Tiền nước",
        "unit_price": 25000.0,
        "unit": ServiceUnit.PER_CUBIC_METER,
        "category": ServiceCategory.METERED,
        "active": True,
    },
    {
        Field.CODE: "internet",
        "name": "Phí Internet/Wifi",
        "unit_price": 100000.0,
        "unit": ServiceUnit.PER_ROOM,
        "category": ServiceCategory.FIXED,
        "active": True,
    },
    {
        Field.CODE: "security",
        "name": "Phí an ninh & PCCC",
        "unit_price": 50000.0,
        "unit": ServiceUnit.PER_MONTH,
        "category": ServiceCategory.FIXED,
        "active": True,
    },
    {
        Field.CODE: "sanitation",
        "name": "Phí vệ sinh & rác thải",
        "unit_price": 30000.0,
        "unit": ServiceUnit.PER_MONTH,
        "category": ServiceCategory.FIXED,
        "active": True,
    },
)


class ServiceSettingService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.SERVICES)

    async def ensure_defaults(self) -> None:
        """Seed the standard price list once, so a fresh database can bill."""
        for entry in DEFAULT_SERVICES:
            await self._collection.update_one(
                {Field.CODE: entry[Field.CODE]},
                {"$setOnInsert": {**entry, Field.CREATED_AT: datetime.now(UTC)}},
                upsert=True,
            )

    async def list(self, offset: int, limit: int) -> tuple[list[ServiceSchema], int]:
        total: int = await self._collection.count_documents({})
        cursor = self._collection.find({}).sort(Field.CODE, 1).skip(offset).limit(limit)
        return [ServiceSchema.model_validate(serialize(doc)) async for doc in cursor], total

    async def active_map(self) -> dict[str, dict[str, Any]]:
        """Active prices keyed by code — the lookup the invoice formula uses."""
        cursor = self._collection.find({"active": True})
        return {str(doc[Field.CODE]): doc async for doc in cursor}

    async def get(self, service_id: str) -> ServiceSchema:
        document = await self._collection.find_one(
            {Field.ID: to_object_id(service_id, ErrorMessage.SERVICE_NOT_FOUND)}
        )
        if document is None:
            raise NotFoundError(ErrorMessage.SERVICE_NOT_FOUND)
        return ServiceSchema.model_validate(serialize(document))

    async def create(self, payload: ServiceCreate) -> ServiceSchema:
        if await self._collection.find_one({Field.CODE: payload.code}):
            raise ConflictError(ErrorMessage.SERVICE_CODE_TAKEN)
        document: dict[str, Any] = {**payload.model_dump(), Field.CREATED_AT: datetime.now(UTC)}
        result = await self._collection.insert_one(document)
        document[Field.ID] = result.inserted_id
        return ServiceSchema.model_validate(serialize(document))

    async def update(self, service_id: str, payload: ServiceUpdate) -> ServiceSchema:
        changes = payload.model_dump(exclude_none=True)
        if changes:
            result = await self._collection.update_one(
                {Field.ID: to_object_id(service_id, ErrorMessage.SERVICE_NOT_FOUND)},
                {"$set": changes},
            )
            if result.matched_count == 0:
                raise NotFoundError(ErrorMessage.SERVICE_NOT_FOUND)
        return await self.get(service_id)

    async def delete(self, service_id: str) -> None:
        result = await self._collection.delete_one(
            {Field.ID: to_object_id(service_id, ErrorMessage.SERVICE_NOT_FOUND)}
        )
        if result.deleted_count == 0:
            raise NotFoundError(ErrorMessage.SERVICE_NOT_FOUND)


service_setting_service = ServiceSettingService()
