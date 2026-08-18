"""Electricity and water readings.

Saving a room's readings is what triggers its invoice for that period, so the
two stay in step without a separate "generate invoices" step.
"""

from datetime import UTC, datetime
from typing import Any

from app.common.documents import serialize
from app.common.exceptions import BadRequestError, NotFoundError
from app.common.periods import current_period, previous_period
from app.core.constants import (
    Collection,
    ContractStatus,
    Field,
    MeterFilter,
    Pagination,
    ServiceCode,
)
from app.core.messages import ErrorMessage
from app.db.mongo import get_collection
from app.schemas.meter import MeterReadingSave, MeterRow
from app.services.invoice import invoice_service
from app.services.room import room_service

_LIVE_STATUSES = (ContractStatus.ACTIVE, ContractStatus.EXPIRING, ContractStatus.OVERDUE)


def _matches_filter(row: MeterRow, tab: str) -> bool:
    if tab == MeterFilter.MISSING_ELECTRIC:
        return row.electric_new is None
    if tab == MeterFilter.MISSING_WATER:
        return row.water_new is None
    if tab == MeterFilter.COMPLETE:
        return row.electric_new is not None and row.water_new is not None
    return True


def _matches_search(row: MeterRow, search: str) -> bool:
    needle = search.strip().lower()
    if not needle:
        return True
    return needle in row.room_number.lower() or needle in (row.tenant_name or "").lower()


class MeterService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.METER_READINGS)

    async def _reading(self, room_id: str, period: str) -> dict[str, Any] | None:
        document: dict[str, Any] | None = await self._collection.find_one(
            {Field.ROOM_ID: room_id, Field.PERIOD: period}
        )
        return document

    async def _carried_forward(self, room_id: str, period: str) -> tuple[float, float]:
        """Last period's closing numbers become this period's opening numbers."""
        previous = await self._reading(room_id, previous_period(period))
        if previous is None:
            return 0.0, 0.0
        return (
            float(previous.get("electric_new") or previous.get("electric_old") or 0),
            float(previous.get("water_new") or previous.get("water_old") or 0),
        )

    async def grid(
        self, period: str | None = None, tab: str = MeterFilter.ALL, search: str = ""
    ) -> list[MeterRow]:
        """One row per occupied room, both meters side by side."""
        target = period or current_period()

        contracts = get_collection(Collection.CONTRACTS)
        by_room: dict[str, dict[str, Any]] = {}
        async for contract in contracts.find({Field.STATUS: {"$in": _LIVE_STATUSES}}):
            by_room[str(contract[Field.ROOM_ID])] = contract

        rooms, _ = await room_service.list(0, Pagination.GRID_SIZE)
        invoices = get_collection(Collection.INVOICES)

        rows: list[MeterRow] = []
        for room in rooms:
            contract = by_room.get(room.id)
            if contract is None:
                continue

            reading = await self._reading(room.id, target)
            if reading is None:
                electric_old, water_old = await self._carried_forward(room.id, target)
                electric_new = water_new = None
            else:
                electric_old = float(reading.get("electric_old", 0))
                water_old = float(reading.get("water_old", 0))
                electric_new = reading.get("electric_new")
                water_new = reading.get("water_new")

            invoice = await invoices.find_one({Field.ROOM_ID: room.id, Field.PERIOD: target})

            row = MeterRow(
                room_id=room.id,
                room_number=room.room_number,
                floor=room.floor,
                contract_id=str(contract[Field.ID]),
                tenant_name=contract.get("tenant_name"),
                period=target,
                electric_old=electric_old,
                electric_new=None if electric_new is None else float(electric_new),
                water_old=water_old,
                water_new=None if water_new is None else float(water_new),
                invoice_id=str(invoice[Field.ID]) if invoice else None,
            )
            if _matches_filter(row, tab) and _matches_search(row, search):
                rows.append(row)
        return rows

    async def save(self, room_id: str, payload: MeterReadingSave) -> MeterRow:
        """Persist one room's readings and rebuild that period's invoice."""
        room = await room_service.get_document(room_id)
        contract = await get_collection(Collection.CONTRACTS).find_one(
            {Field.ROOM_ID: room_id, Field.STATUS: {"$in": _LIVE_STATUSES}}
        )
        if contract is None:
            raise NotFoundError(ErrorMessage.METER_NO_ACTIVE_CONTRACT)

        period = payload.period
        existing = await self._reading(room_id, period)
        if existing is None:
            electric_old, water_old = await self._carried_forward(room_id, period)
        else:
            electric_old = float(existing.get("electric_old", 0))
            water_old = float(existing.get("water_old", 0))

        # A meter never runs backwards; catching it here keeps a bad reading out
        # of the invoice rather than producing a negative charge.
        if payload.electric_new is not None and payload.electric_new < electric_old:
            raise BadRequestError(ErrorMessage.METER_BELOW_PREVIOUS)
        if payload.water_new is not None and payload.water_new < water_old:
            raise BadRequestError(ErrorMessage.METER_BELOW_PREVIOUS)

        document: dict[str, Any] = {
            Field.ROOM_ID: room_id,
            Field.CONTRACT_ID: str(contract[Field.ID]),
            Field.PERIOD: period,
            "electric_old": electric_old,
            "electric_new": payload.electric_new,
            "water_old": water_old,
            "water_new": payload.water_new,
            "recorded_at": datetime.now(UTC),
        }
        await self._collection.update_one(
            {Field.ROOM_ID: room_id, Field.PERIOD: period}, {"$set": document}, upsert=True
        )

        # Only a period with both meters closed can be billed.
        if payload.electric_new is not None and payload.water_new is not None:
            await invoice_service.upsert_for_period(
                room=room,
                contract=contract,
                period=period,
                electric_usage=payload.electric_new - electric_old,
                water_usage=payload.water_new - water_old,
                meters={
                    ServiceCode.ELECTRICITY: (electric_old, payload.electric_new),
                    ServiceCode.WATER: (water_old, payload.water_new),
                },
            )

        invoice = await get_collection(Collection.INVOICES).find_one(
            {Field.ROOM_ID: room_id, Field.PERIOD: period}
        )
        return MeterRow(
            room_id=room_id,
            room_number=str(room[Field.ROOM_NUMBER]),
            floor=int(room[Field.FLOOR]),
            contract_id=str(contract[Field.ID]),
            tenant_name=contract.get("tenant_name"),
            period=period,
            electric_old=electric_old,
            electric_new=payload.electric_new,
            water_old=water_old,
            water_new=payload.water_new,
            invoice_id=str(invoice[Field.ID]) if invoice else None,
        )

    async def history(self, room_id: str, limit: int) -> list[dict[str, Any]]:
        cursor = self._collection.find({Field.ROOM_ID: room_id}).sort(Field.PERIOD, -1).limit(limit)
        return [serialize(doc) async for doc in cursor]


meter_service = MeterService()
