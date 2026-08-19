"""Put issued invoices back into DRAFT so the monthly dispatch picks them up again.

Written for exercising the cron path end to end, and for the real case where a
batch went out wrong and has to be re-sent.

    MONGODB_URL=... RESET_PERIOD=2026-08 RESET_ROOM=301 \
        backend/.venv/bin/python -m scripts.reset_invoice_draft

RESET_PERIOD is required — a run without it would rewrite every invoice in the
database. RESET_ROOM is optional; leaving it out takes the whole period, which
means one email per invoice on the next dispatch.

Payment state is never destroyed: an invoice that is partially paid or paid is
reported and skipped, because moving it back to draft would let a later send
overwrite what someone already paid. Only `sent` and `unpaid` reset — unpaid
carries no money yet.
"""

import asyncio
import os

from app.core.config import settings
from app.core.constants import Collection, Field, InvoiceStatus
from app.db import mongo

PERIOD_VAR = "RESET_PERIOD"
ROOM_VAR = "RESET_ROOM"
# The two statuses carrying no payment yet, so rewinding them loses nothing.
RESETTABLE = (InvoiceStatus.SENT, InvoiceStatus.UNPAID)


async def reset_invoice_draft() -> None:
    period = os.environ.get(PERIOD_VAR, "").strip()
    room_number = os.environ.get(ROOM_VAR, "").strip()

    if not period:
        raise SystemExit(f"Set {PERIOD_VAR} (YYYY-MM) — refusing to touch every period.")

    await mongo.connect()
    try:
        invoices = mongo.get_collection(Collection.INVOICES)
        print(f"database: {settings.mongodb_db}")

        query: dict[str, object] = {Field.PERIOD: period}
        if room_number:
            room = await mongo.get_collection(Collection.ROOMS).find_one(
                {Field.ROOM_NUMBER: room_number}
            )
            if room is None:
                raise SystemExit(f"No room numbered {room_number!r}.")
            query[Field.ROOM_ID] = str(room[Field.ID])

        scope = f"period {period}" + (f", room {room_number}" if room_number else ", every room")
        matched = await invoices.count_documents(query)
        if matched == 0:
            raise SystemExit(f"No invoice for {scope}.")

        # Only these two really carry money; UNPAID is payment-locked for a
        # resend but has nothing paid against it yet, so it may rewind.
        paid_statuses = [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID]
        locked = await invoices.count_documents({**query, Field.STATUS: {"$in": paid_statuses}})
        result = await invoices.update_many(
            {**query, Field.STATUS: {"$in": list(RESETTABLE)}},
            {"$set": {Field.STATUS: InvoiceStatus.DRAFT, "sent_at": None}},
        )

        print(f"{scope}: {matched} invoice(s) matched, {result.modified_count} reset to draft")
        # PAYMENT_LOCKED includes UNPAID, which does reset; report only the ones
        # actually left behind so the number matches what happened.
        skipped = matched - result.modified_count
        if skipped:
            print(f"{skipped} left alone (already draft, or carrying a payment)")
        if locked:
            print(f"{locked} of those are partially paid or paid — payment state kept")
    finally:
        await mongo.close()


if __name__ == "__main__":
    asyncio.run(reset_invoice_draft())
