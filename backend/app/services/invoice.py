"""Invoices: automatic calculation, delivery, and payment tracking.

    total = base rent
          + electricity usage x electricity price
          + water usage x water price
          + every active fixed fee

Each line snapshots the unit price it was billed at, so later edits to master
data leave issued invoices untouched.
"""

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId

from app.common.documents import serialize, to_object_id
from app.common.exceptions import BadRequestError, EmailDeliveryError, NotFoundError
from app.common.money import to_vnd
from app.core.config import settings
from app.core.constants import (
    Collection,
    Field,
    InvoiceStatus,
    ServiceCategory,
    ServiceCode,
    ServiceUnit,
)
from app.core.messages import EmailTemplate, ErrorMessage
from app.db.mongo import get_collection
from app.schemas.invoice import InvoiceDispatchResult, InvoiceLine, InvoiceSchema
from app.schemas.tenant import TenantBalance
from app.services.email import render_invoice_email, send_email
from app.services.service_setting import service_setting_service

logger = logging.getLogger(__name__)


def _fixed_quantity(unit: str, occupants: int) -> float:
    """Per-person fees scale with the household; per-room and per-month do not."""
    return float(occupants) if unit == ServiceUnit.PER_PERSON else 1.0


class InvoiceService:
    @property
    def _collection(self) -> Any:
        return get_collection(Collection.INVOICES)

    async def _decorate(self, document: dict[str, Any]) -> InvoiceSchema:
        data = serialize(document)
        room = await get_collection(Collection.ROOMS).find_one(
            {Field.ID: ObjectId(str(data[Field.ROOM_ID]))}
        )
        data[Field.ROOM_NUMBER] = room.get(Field.ROOM_NUMBER) if room else None

        contract = await get_collection(Collection.CONTRACTS).find_one(
            {Field.ID: ObjectId(str(data[Field.CONTRACT_ID]))}
        )
        data["tenant_name"] = contract.get("tenant_name") if contract else None
        data["tenant_email"] = contract.get("tenant_email") if contract else None
        return InvoiceSchema.model_validate(data)

    async def build_lines(
        self,
        electric_usage: float,
        water_usage: float,
        occupants: int,
        meters: dict[str, tuple[float, float]],
    ) -> list[InvoiceLine]:
        """Turn the current price list plus this period's usage into billed lines."""
        prices = await service_setting_service.active_map()
        lines: list[InvoiceLine] = []

        usage_by_code = {
            ServiceCode.ELECTRICITY: electric_usage,
            ServiceCode.WATER: water_usage,
        }

        for code, price in sorted(prices.items()):
            unit_price = float(price.get("unit_price", 0))
            unit = str(price.get("unit", ServiceUnit.PER_MONTH))
            category = str(price.get("category", ServiceCategory.FIXED))

            if category == ServiceCategory.METERED:
                if code not in usage_by_code:
                    # A metered service with no reading has nothing to bill this period.
                    continue
                quantity = usage_by_code[code]
                old_new = meters.get(code)
                meter_old, meter_new = old_new if old_new else (None, None)
            else:
                quantity = _fixed_quantity(unit, occupants)
                meter_old = meter_new = None

            lines.append(
                InvoiceLine(
                    code=code,
                    name=str(price.get("name", code)),
                    unit=unit,
                    unit_price=to_vnd(unit_price),
                    quantity=quantity,
                    amount=to_vnd(unit_price * quantity),
                    meter_old=meter_old,
                    meter_new=meter_new,
                )
            )
        return lines

    async def upsert_for_period(
        self,
        room: dict[str, Any],
        contract: dict[str, Any],
        period: str,
        electric_usage: float,
        water_usage: float,
        meters: dict[str, tuple[float, float]],
    ) -> InvoiceSchema:
        """Create or refresh the draft invoice a meter reading implies.

        Re-saving a reading recalculates the same period rather than duplicating
        it, but an invoice that has already been sent or paid keeps its status.
        """
        room_charge = to_vnd(float(room.get("base_price", 0)))
        occupants = int(contract.get("occupants", 1))
        lines = await self.build_lines(electric_usage, water_usage, occupants, meters)
        total = to_vnd(room_charge + sum(line.amount for line in lines))

        existing = await self._collection.find_one(
            {Field.ROOM_ID: str(room[Field.ID]), Field.PERIOD: period}
        )

        payload: dict[str, Any] = {
            Field.ROOM_ID: str(room[Field.ID]),
            Field.CONTRACT_ID: str(contract[Field.ID]),
            Field.PERIOD: period,
            "room_charge": room_charge,
            "lines": [line.model_dump() for line in lines],
            Field.TOTAL: total,
            Field.DUE_DATE: datetime.now(UTC) + timedelta(days=settings.payment_due_days),
        }

        if existing is None:
            payload.update(
                {
                    Field.PAID_AMOUNT: 0.0,
                    Field.STATUS: InvoiceStatus.DRAFT,
                    "sent_at": None,
                    Field.CREATED_AT: datetime.now(UTC),
                }
            )
            result = await self._collection.insert_one(payload)
            payload[Field.ID] = result.inserted_id
            return await self._decorate(payload)

        await self._collection.update_one({Field.ID: existing[Field.ID]}, {"$set": payload})
        return await self._decorate({**existing, **payload})

    async def list(
        self,
        offset: int,
        limit: int,
        status: str | None = None,
        period: str | None = None,
        contract_id: str | None = None,
        statuses: tuple[str, ...] | None = None,
    ) -> tuple[list[InvoiceSchema], int]:
        query: dict[str, Any] = {}
        if status:
            query[Field.STATUS] = status
        elif statuses:
            query[Field.STATUS] = {"$in": list(statuses)}
        if period:
            query[Field.PERIOD] = period
        if contract_id:
            query[Field.CONTRACT_ID] = contract_id

        total: int = await self._collection.count_documents(query)
        cursor = (
            self._collection.find(query)
            .sort([(Field.PERIOD, -1), (Field.CREATED_AT, -1)])
            .skip(offset)
            .limit(limit)
        )
        return [await self._decorate(doc) async for doc in cursor], total

    async def get(self, invoice_id: str) -> InvoiceSchema:
        return await self._decorate(await self.get_document(invoice_id))

    async def balance_for(self, contract_id: str) -> TenantBalance:
        """Sum what a contract still owes across every issued invoice.

        Computed here rather than in the client because the invoice list is
        paginated: adding up one page would quietly under-report a tenant who
        has been here longer than a page.
        """
        cursor = self._collection.find(
            {
                Field.CONTRACT_ID: contract_id,
                Field.STATUS: {"$in": list(InvoiceStatus.OUTSTANDING)},
            }
        ).sort(Field.PERIOD, -1)
        documents = [doc async for doc in cursor]

        if not documents:
            return TenantBalance(
                outstanding=0.0,
                current_due=0.0,
                previous_due=0.0,
                unpaid_count=0,
            )

        def remaining(doc: dict[str, Any]) -> float:
            return max(float(doc[Field.TOTAL]) - float(doc.get(Field.PAID_AMOUNT, 0.0)), 0.0)

        # Sorted newest first, so the head is the period being billed now and the
        # tail is whatever was left unsettled before it.
        newest = documents[0]
        current_due = remaining(newest)
        previous_due = sum(remaining(doc) for doc in documents[1:])

        due_dates = [doc[Field.DUE_DATE] for doc in documents if doc.get(Field.DUE_DATE)]

        return TenantBalance(
            outstanding=to_vnd(current_due + previous_due),
            current_due=to_vnd(current_due),
            previous_due=to_vnd(previous_due),
            current_period=str(newest[Field.PERIOD]),
            due_date=min(due_dates) if due_dates else None,
            unpaid_count=len(documents),
        )

    async def get_document(self, invoice_id: str) -> dict[str, Any]:
        document: dict[str, Any] | None = await self._collection.find_one(
            {Field.ID: to_object_id(invoice_id, ErrorMessage.INVOICE_NOT_FOUND)}
        )
        if document is None:
            raise NotFoundError(ErrorMessage.INVOICE_NOT_FOUND)
        return document

    async def send(self, invoice_id: str) -> InvoiceSchema:
        """Mail the invoice. A resend never rewrites an existing payment state."""
        invoice = await self.get(invoice_id)
        if not invoice.tenant_email:
            raise BadRequestError(ErrorMessage.INVOICE_NO_EMAIL)

        await send_email(
            invoice.tenant_email,
            EmailTemplate.INVOICE_SUBJECT.format(
                room_number=invoice.room_number or "", period=invoice.period
            ),
            render_invoice_email(invoice),
        )

        changes: dict[str, Any] = {"sent_at": datetime.now(UTC)}
        if invoice.status not in InvoiceStatus.PAYMENT_LOCKED:
            changes[Field.STATUS] = InvoiceStatus.UNPAID

        await self._collection.update_one(
            {Field.ID: to_object_id(invoice_id, ErrorMessage.INVOICE_NOT_FOUND)},
            {"$set": changes},
        )
        return await self.get(invoice_id)

    async def record_payment(self, invoice_id: str, paid_amount: float) -> InvoiceSchema:
        invoice = await self.get(invoice_id)
        if paid_amount < 0:
            raise BadRequestError(ErrorMessage.PAYMENT_NEGATIVE)
        if paid_amount > invoice.total:
            raise BadRequestError(ErrorMessage.PAYMENT_EXCEEDS_TOTAL)

        amount = to_vnd(paid_amount)
        if amount >= invoice.total:
            status = InvoiceStatus.PAID
        elif amount > 0:
            status = InvoiceStatus.PARTIALLY_PAID
        else:
            status = InvoiceStatus.SENT if invoice.sent_at else InvoiceStatus.DRAFT

        await self._collection.update_one(
            {Field.ID: to_object_id(invoice_id, ErrorMessage.INVOICE_NOT_FOUND)},
            {"$set": {Field.PAID_AMOUNT: amount, Field.STATUS: status}},
        )
        return await self.get(invoice_id)

    async def set_status(self, invoice_id: str, status: str) -> InvoiceSchema:
        await self._collection.update_one(
            {Field.ID: to_object_id(invoice_id, ErrorMessage.INVOICE_NOT_FOUND)},
            {"$set": {Field.STATUS: status}},
        )
        return await self.get(invoice_id)

    async def send_pending(self) -> InvoiceDispatchResult:
        """Dispatch every draft invoice. Driven by the monthly scheduler.

        Counts both outcomes: a run that fails every send reports failed > 0
        rather than passing for an empty run.
        """
        cursor = self._collection.find({Field.STATUS: InvoiceStatus.DRAFT})
        ids = [str(doc[Field.ID]) async for doc in cursor]
        sent = 0
        failed = 0
        for invoice_id in ids:
            try:
                await self.send(invoice_id)
            except BadRequestError:
                # A contract with no address cannot be mailed; the rest still go.
                logger.warning("Invoice %s has no tenant email; left as draft.", invoice_id)
                failed += 1
                continue
            except EmailDeliveryError:
                # One rejected address must not abort the batch, and the monthly
                # cron must not go red over it — send() leaves the invoice in
                # DRAFT, so the next run picks it up again.
                logger.warning("Invoice %s could not be mailed; left as draft.", invoice_id)
                failed += 1
                continue
            sent += 1
        return InvoiceDispatchResult(sent=sent, failed=failed)


invoice_service = InvoiceService()
