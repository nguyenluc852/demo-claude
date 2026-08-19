"""The machine-to-machine dispatch endpoint: the guard, and what it reports.

A run where every send is refused must not look like a run with nothing to do —
the monthly cron reads this response and would otherwise stay green while no
mail leaves at all.
"""

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.common.exceptions import EmailDeliveryError
from app.core.config import settings
from app.core.constants import Header, InvoiceStatus, Route
from app.core.messages import ErrorCode
from tests.conftest import API
from tests.factories import create_contract, create_room, save_reading

PERIOD = "2026-08"
# Fixture-only, on the throwaway test database.
CRON_SECRET = "pytest-fixture-only"


@pytest.fixture
def cron_secret() -> Any:
    """Arm the guard for one test, then disarm it so other cases see it closed."""
    settings.cron_secret = CRON_SECRET
    yield
    settings.cron_secret = ""


def _draft_invoice(client: TestClient, auth: dict[str, str], **contract: Any) -> str:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"], **contract)
    response = save_reading(client, auth, room["id"], PERIOD, 150, 12)
    invoice_id: str = response.json()["data"]["invoice_id"]
    return invoice_id


def test_without_the_secret_the_endpoint_stays_closed(client: TestClient) -> None:
    response = client.post(f"{API}{Route.INVOICE_DISPATCH}")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == ErrorCode.FORBIDDEN


def test_an_unset_secret_refuses_every_caller(client: TestClient) -> None:
    """Fail closed: forgetting the environment variable must not open the door."""
    settings.cron_secret = ""
    response = client.post(
        f"{API}{Route.INVOICE_DISPATCH}", headers={Header.CRON_SECRET: CRON_SECRET}
    )
    assert response.status_code == 403


def test_dispatch_reports_what_it_sent(
    client: TestClient, auth: dict[str, str], cron_secret: None
) -> None:
    _draft_invoice(client, auth)
    response = client.post(
        f"{API}{Route.INVOICE_DISPATCH}", headers={Header.CRON_SECRET: CRON_SECRET}
    )
    assert response.status_code == 200
    assert response.json()["data"] == {"sent": 1, "failed": 0}


def test_a_refused_send_counts_as_failed_and_keeps_the_draft(
    client: TestClient, auth: dict[str, str], cron_secret: None, monkeypatch: Any
) -> None:
    invoice_id = _draft_invoice(client, auth)

    async def refuse(*_: Any, **__: Any) -> None:
        raise EmailDeliveryError

    monkeypatch.setattr("app.services.invoice.send_email", refuse)
    response = client.post(
        f"{API}{Route.INVOICE_DISPATCH}", headers={Header.CRON_SECRET: CRON_SECRET}
    )

    # 200, not 500: one bad address must not turn the monthly job red.
    assert response.status_code == 200
    assert response.json()["data"] == {"sent": 0, "failed": 1}

    # Still draft, so the next run tries again rather than losing the invoice.
    invoice = client.get(f"{API}{Route.INVOICE_DETAIL.format(invoice_id=invoice_id)}", headers=auth)
    assert invoice.json()["data"]["status"] == InvoiceStatus.DRAFT
