"""Guardrails of `scripts.seed.issue_invoices`.

The seed is re-run against databases that already hold work someone did by
hand, so the interesting property is not that it issues invoices but that it
refuses to touch anything that is no longer a draft.

Drafts are inserted straight into Mongo rather than billed through the API: the
function reads three fields off the document and calls the invoice service, so
a hand-built draft exercises it exactly. `conftest` has already repointed
`settings.mongodb_db` at `<db>_test`, and every case asserts that redirect still
holds before writing.
"""

from datetime import UTC, datetime
from typing import Any

import pytest
from bson import ObjectId

from app.core.config import settings
from app.core.constants import Collection, Field, InvoiceStatus
from app.db import mongo
from app.services.invoice import invoice_service
from scripts.seed import ISSUE_PLAN, issue_invoices

TEST_DB_SUFFIX = "_test"

PERIODS = ["2026-06", "2026-07", "2026-08"]
# Distinct per period, so a mixed-up plan cannot pass by coincidence.
TOTALS = [1_200_000.0, 900_000.0, 1_500_000.0]
HALF_PAID_ELSEWHERE = 400_000.0

# `sent_at` has no entry in `Field` yet; named once here rather than spelled at
# each use, so the day it gains one there is a single line to change.
SENT_AT = "sent_at"


@pytest.fixture(autouse=True)
def guard_test_database() -> None:
    """The function writes, so a case that reached the dev database would
    rewrite invoices a dev server is serving."""
    assert settings.mongodb_db.endswith(TEST_DB_SUFFIX), settings.mongodb_db


@pytest.fixture
async def connected() -> Any:
    """`issue_invoices` resolves its collection at call time, exactly like the
    seed does, so the suite has to open the same connection the seed opens."""
    await mongo.connect()
    yield
    await mongo.close()


def _insert_invoice(
    mongo_database: Any,
    room_id: str,
    period: str,
    total: float,
    status: str = InvoiceStatus.DRAFT,
    paid_amount: float = 0.0,
) -> str:
    result = mongo_database[Collection.INVOICES].insert_one(
        {
            Field.ROOM_ID: room_id,
            Field.CONTRACT_ID: str(ObjectId()),
            Field.PERIOD: period,
            "room_charge": total,
            "lines": [],
            Field.TOTAL: total,
            Field.PAID_AMOUNT: paid_amount,
            Field.STATUS: status,
            Field.DUE_DATE: datetime(2026, 9, 5, tzinfo=UTC),
            SENT_AT: None,
            Field.CREATED_AT: datetime(2026, 8, 20, tzinfo=UTC),
        }
    )
    return str(result.inserted_id)


def _state(mongo_database: Any, invoice_id: str) -> tuple[str, float, Any]:
    document = mongo_database[Collection.INVOICES].find_one({Field.ID: ObjectId(invoice_id)})
    assert document is not None
    return document[Field.STATUS], document[Field.PAID_AMOUNT], document.get(SENT_AT)


async def test_walks_the_three_drafts_through_the_issue_plan(
    mongo_database: Any, connected: None
) -> None:
    """Oldest settled, the one before last half paid, the newest still owed —
    that is what gives a freshly seeded tenant portal a real arrears figure."""
    room_id = str(ObjectId())
    ids = [
        _insert_invoice(mongo_database, room_id, period, total)
        for period, total in zip(PERIODS, TOTALS, strict=True)
    ]

    await issue_invoices(room_id, PERIODS)

    statuses = [_state(mongo_database, invoice_id)[0] for invoice_id in ids]
    assert statuses == list(ISSUE_PLAN)

    paid = [_state(mongo_database, invoice_id)[1] for invoice_id in ids]
    assert paid == [TOTALS[0], round(TOTALS[1] / 2), 0.0]


async def test_stamps_every_issued_invoice_as_sent(
    mongo_database: Any, connected: None
) -> None:
    """The CMS reads `sent_at` to choose between send and resend, so a status
    change without it would offer to send an invoice that is already out."""
    room_id = str(ObjectId())
    ids = [
        _insert_invoice(mongo_database, room_id, period, total)
        for period, total in zip(PERIODS, TOTALS, strict=True)
    ]

    await issue_invoices(room_id, PERIODS)

    for invoice_id in ids:
        assert (await invoice_service.get(invoice_id)).sent_at is not None


async def test_second_run_changes_nothing(mongo_database: Any, connected: None) -> None:
    """The seed is documented as re-runnable. Once the drafts are gone, a second
    pass has no drafts left to act on and must leave the settlements alone."""
    room_id = str(ObjectId())
    ids = [
        _insert_invoice(mongo_database, room_id, period, total)
        for period, total in zip(PERIODS, TOTALS, strict=True)
    ]

    await issue_invoices(room_id, PERIODS)
    after_first = [_state(mongo_database, invoice_id) for invoice_id in ids]
    await issue_invoices(room_id, PERIODS)

    assert [_state(mongo_database, invoice_id) for invoice_id in ids] == after_first


async def test_leaves_an_invoice_that_was_settled_by_hand(
    mongo_database: Any, connected: None
) -> None:
    """The one that protects real data: someone recorded a payment through the
    CMS, then the seed was re-run. Resetting that row would lose the payment."""
    room_id = str(ObjectId())
    settled_id = _insert_invoice(
        mongo_database,
        room_id,
        PERIODS[0],
        TOTALS[0],
        status=InvoiceStatus.PARTIALLY_PAID,
        paid_amount=HALF_PAID_ELSEWHERE,
    )
    draft_id = _insert_invoice(mongo_database, room_id, PERIODS[1], TOTALS[1])

    await issue_invoices(room_id, PERIODS)

    assert _state(mongo_database, settled_id) == (
        InvoiceStatus.PARTIALLY_PAID,
        HALF_PAID_ELSEWHERE,
        None,
    )
    # The draft next to it still moves: skipping one period must not abort the run.
    assert _state(mongo_database, draft_id)[0] == ISSUE_PLAN[1]


async def test_ignores_periods_with_no_invoice(
    mongo_database: Any, connected: None
) -> None:
    """Only periods where both meters were saved produce an invoice, so a gap is
    normal — it must not raise, and it must not invent a document."""
    room_id = str(ObjectId())
    invoice_id = _insert_invoice(mongo_database, room_id, PERIODS[2], TOTALS[2])

    await issue_invoices(room_id, PERIODS)

    assert mongo_database[Collection.INVOICES].count_documents({Field.ROOM_ID: room_id}) == 1
    assert _state(mongo_database, invoice_id)[0] == ISSUE_PLAN[2]
