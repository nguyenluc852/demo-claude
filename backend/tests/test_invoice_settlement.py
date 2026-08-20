"""What one invoice actually asks the tenant to transfer, arrears included.

`settlement_for` reads several invoice documents, so these cases drive the real
service against the suite's database rather than a stub. The service is async
while `TestClient` is not, and the app's Motor client is bound to the loop the
client's portal runs — hence `_settlement`, which hands the coroutine to that
same loop instead of starting a second one.
"""

from datetime import UTC, datetime
from typing import Any

from fastapi.testclient import TestClient

from app.core.constants import Collection, Field, InvoiceStatus, Route
from app.schemas.invoice import InvoiceSettlement
from app.services.invoice import invoice_service
from tests.conftest import API
from tests.factories import create_contract, create_room, save_reading

PERIOD = "2026-08"
EARLIER_PERIOD = "2026-07"
OLDEST_PERIOD = "2026-06"
PART_PAYMENT = 1_000_000

# Meter readings are cumulative, so the periods have to climb in time order.
READINGS: dict[str, tuple[float, float]] = {
    OLDEST_PERIOD: (100, 8),
    EARLIER_PERIOD: (150, 12),
    PERIOD: (200, 16),
}

# Deliberately the oldest period's: a settlement that reported the invoice's own
# due date, or the newest arrear's, would pass on any other assignment.
EARLIEST_DUE = datetime(2026, 7, 5, tzinfo=UTC)
MIDDLE_DUE = datetime(2026, 8, 5, tzinfo=UTC)
LATEST_DUE = datetime(2026, 9, 5, tzinfo=UTC)


def _bill(
    client: TestClient, auth: dict[str, str], periods: tuple[str, ...]
) -> tuple[str, dict[str, dict[str, Any]]]:
    """One contract billed for each period, returned keyed by period."""
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    for period in periods:
        electric, water = READINGS[period]
        response = save_reading(client, auth, room["id"], period, electric, water)
        assert response.status_code == 200, response.text

    listed: list[dict[str, Any]] = client.get(f"{API}{Route.INVOICES}", headers=auth).json()[
        "data"
    ]
    assert len(listed) == len(periods)
    return str(room["id"]), {row[Field.PERIOD]: row for row in listed}


def _send(client: TestClient, auth: dict[str, str], invoice: dict[str, Any]) -> None:
    response = client.post(
        f"{API}{Route.INVOICE_SEND.format(invoice_id=invoice['id'])}", headers=auth
    )
    assert response.status_code == 200, response.text


def _pay(
    client: TestClient, auth: dict[str, str], invoice: dict[str, Any], amount: float
) -> str:
    response = client.patch(
        f"{API}{Route.INVOICE_PAYMENT.format(invoice_id=invoice['id'])}",
        json={"paid_amount": amount},
        headers=auth,
    )
    assert response.status_code == 200, response.text
    status: str = response.json()["data"][Field.STATUS]
    return status


def _settlement(client: TestClient, invoice_id: str) -> InvoiceSettlement:
    """Run the service on the loop its Mongo client belongs to."""
    portal: Any = client.portal
    invoice = portal.call(invoice_service.get, invoice_id)
    result: InvoiceSettlement = portal.call(invoice_service.settlement_for, invoice)
    return result


def _set_due_dates(mongo_database: Any, room_id: str, dues: dict[str, datetime]) -> None:
    invoices = mongo_database[Collection.INVOICES]
    for period, due in dues.items():
        result = invoices.update_one(
            {Field.ROOM_ID: room_id, Field.PERIOD: period},
            {"$set": {Field.DUE_DATE: due}},
        )
        assert result.matched_count == 1


def test_previous_due_is_the_remainder_of_the_older_invoice(
    client: TestClient, auth: dict[str, str]
) -> None:
    """A half-settled earlier period carries over its difference, not its total.

    Summing the older invoice's total would over-report the transfer by whatever
    the tenant already paid.
    """
    _, invoices = _bill(client, auth, (EARLIER_PERIOD, PERIOD))
    older, current = invoices[EARLIER_PERIOD], invoices[PERIOD]
    _send(client, auth, older)
    _send(client, auth, current)
    assert _pay(client, auth, older, PART_PAYMENT) == InvoiceStatus.PARTIALLY_PAID

    remaining = older[Field.TOTAL] - PART_PAYMENT
    settlement = _settlement(client, current["id"])

    assert settlement.previous_due == remaining
    assert settlement.previous_due != older[Field.TOTAL]
    assert settlement.invoice_total == current[Field.TOTAL]
    assert settlement.paid_amount == 0
    assert settlement.invoice_due == current[Field.TOTAL]
    assert settlement.amount_due == current[Field.TOTAL] + remaining


def test_the_settlement_is_the_same_before_and_after_the_invoice_is_sent(
    client: TestClient, auth: dict[str, str]
) -> None:
    """The case the period comparison exists for.

    `send()` renders the mail before it flips DRAFT to UNPAID, so a rule that
    picked arrears by excluding this invoice's id would answer differently
    depending on which side of that write it was asked from. Comparing periods
    makes the first send and every resend agree.
    """
    _, invoices = _bill(client, auth, (EARLIER_PERIOD, PERIOD))
    older, current = invoices[EARLIER_PERIOD], invoices[PERIOD]
    _send(client, auth, older)
    _pay(client, auth, older, PART_PAYMENT)
    assert current[Field.STATUS] == InvoiceStatus.DRAFT

    before = _settlement(client, current["id"])
    _send(client, auth, current)
    after = _settlement(client, current["id"])

    assert before.previous_due == older[Field.TOTAL] - PART_PAYMENT
    assert before.amount_due == current[Field.TOTAL] + before.previous_due
    assert after == before


def test_a_later_period_is_never_reported_as_arrears(
    client: TestClient, auth: dict[str, str]
) -> None:
    """Resending an older invoice must not bill it for the period after it."""
    _, invoices = _bill(client, auth, (EARLIER_PERIOD, PERIOD))
    older, current = invoices[EARLIER_PERIOD], invoices[PERIOD]
    _send(client, auth, older)
    _send(client, auth, current)

    settlement = _settlement(client, older["id"])

    assert settlement.previous_due == 0
    assert settlement.amount_due == older[Field.TOTAL]
    assert settlement.earliest_due_date is None
    assert current[Field.TOTAL] > 0  # the later invoice was owed and still skipped


def test_a_draft_earlier_period_is_not_owed_yet(
    client: TestClient, auth: dict[str, str]
) -> None:
    """A draft has not been issued, so it is not arrears — same rule as the list."""
    _, invoices = _bill(client, auth, (EARLIER_PERIOD, PERIOD))
    older, current = invoices[EARLIER_PERIOD], invoices[PERIOD]
    _send(client, auth, current)
    assert older[Field.STATUS] == InvoiceStatus.DRAFT

    settlement = _settlement(client, current["id"])

    assert settlement.previous_due == 0
    assert settlement.amount_due == current[Field.TOTAL]
    assert older[Field.TOTAL] > 0  # the draft had a real amount and was still skipped


def test_a_fully_paid_earlier_period_is_left_out(
    client: TestClient, auth: dict[str, str]
) -> None:
    _, invoices = _bill(client, auth, (EARLIER_PERIOD, PERIOD))
    older, current = invoices[EARLIER_PERIOD], invoices[PERIOD]
    _send(client, auth, older)
    _send(client, auth, current)
    assert _pay(client, auth, older, older[Field.TOTAL]) == InvoiceStatus.PAID

    settlement = _settlement(client, current["id"])

    assert settlement.previous_due == 0
    assert settlement.amount_due == current[Field.TOTAL]


def test_a_single_period_asks_for_exactly_the_invoice_total(
    client: TestClient, auth: dict[str, str]
) -> None:
    _, invoices = _bill(client, auth, (PERIOD,))
    current = invoices[PERIOD]
    _send(client, auth, current)

    settlement = _settlement(client, current["id"])

    assert settlement.previous_due == 0
    assert settlement.invoice_due == current[Field.TOTAL]
    assert settlement.amount_due == current[Field.TOTAL]
    assert settlement.earliest_due_date is None


def test_the_earliest_due_date_comes_from_the_oldest_arrear(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    """Two periods are overdue; the tenant is chased on the older deadline."""
    room_id, invoices = _bill(client, auth, (OLDEST_PERIOD, EARLIER_PERIOD, PERIOD))
    for invoice in invoices.values():
        _send(client, auth, invoice)
    _set_due_dates(
        mongo_database,
        room_id,
        {OLDEST_PERIOD: EARLIEST_DUE, EARLIER_PERIOD: MIDDLE_DUE, PERIOD: LATEST_DUE},
    )

    settlement = _settlement(client, invoices[PERIOD]["id"])

    assert settlement.earliest_due_date is not None
    assert settlement.earliest_due_date.replace(tzinfo=UTC) == EARLIEST_DUE
    assert settlement.previous_due == (
        invoices[OLDEST_PERIOD][Field.TOTAL] + invoices[EARLIER_PERIOD][Field.TOTAL]
    )
