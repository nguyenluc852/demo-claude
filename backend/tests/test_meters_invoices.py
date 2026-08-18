"""The meter-to-invoice pipeline: the calculation the whole system hangs on."""

from fastapi.testclient import TestClient

from app.core.constants import InvoiceStatus, MeterFilter, QueryParam, Route, ServiceCode
from app.core.messages import ErrorCode
from tests.conftest import API
from tests.factories import create_contract, create_room, save_reading

PERIOD = "2026-08"
NEXT_PERIOD = "2026-09"

# Rent 3,000,000 + 150kWh x 3,500 + 12m3 x 25,000 + 100,000 + 50,000 + 30,000
EXPECTED_TOTAL = 4_005_000


def _occupied_room(client: TestClient, auth: dict[str, str]) -> str:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    room_id: str = room["id"]
    return room_id


def test_grid_lists_every_occupied_room(client: TestClient, auth: dict[str, str]) -> None:
    _occupied_room(client, auth)
    response = client.get(f"{API}{Route.METERS}", headers=auth)
    assert response.status_code == 200
    row = response.json()["data"][0]
    assert row["tenant_name"] == "Nguyen Van A"
    assert row["electric_new"] is None


def test_a_vacant_room_has_no_meter_row(client: TestClient, auth: dict[str, str]) -> None:
    create_room(client, auth)
    response = client.get(f"{API}{Route.METERS}", headers=auth)
    assert response.json()["data"] == []


def test_saving_both_meters_issues_the_invoice(
    client: TestClient, auth: dict[str, str]
) -> None:
    room_id = _occupied_room(client, auth)
    response = save_reading(client, auth, room_id, PERIOD, 150, 12)
    assert response.status_code == 200
    assert response.json()["data"]["invoice_id"]

    invoices = client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"]
    assert len(invoices) == 1
    invoice = invoices[0]
    assert invoice["total"] == EXPECTED_TOTAL
    assert invoice["status"] == InvoiceStatus.DRAFT

    by_code = {line["code"]: line for line in invoice["lines"]}
    assert by_code[ServiceCode.ELECTRICITY]["quantity"] == 150
    assert by_code[ServiceCode.ELECTRICITY]["amount"] == 525_000
    assert by_code[ServiceCode.WATER]["amount"] == 300_000


def test_one_meter_alone_does_not_issue_an_invoice(
    client: TestClient, auth: dict[str, str]
) -> None:
    room_id = _occupied_room(client, auth)
    response = save_reading(client, auth, room_id, PERIOD, 150, None)
    assert response.status_code == 200
    assert response.json()["data"]["invoice_id"] is None
    assert client.get(f"{API}{Route.INVOICES}", headers=auth).json()["meta"]["total"] == 0


def test_a_reading_below_the_previous_one_is_rejected(
    client: TestClient, auth: dict[str, str]
) -> None:
    room_id = _occupied_room(client, auth)
    save_reading(client, auth, room_id, PERIOD, 150, 12)
    response = save_reading(client, auth, room_id, NEXT_PERIOD, 100, 20)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == ErrorCode.BAD_REQUEST


def test_last_period_closing_becomes_this_period_opening(
    client: TestClient, auth: dict[str, str]
) -> None:
    room_id = _occupied_room(client, auth)
    save_reading(client, auth, room_id, PERIOD, 150, 12)
    response = save_reading(client, auth, room_id, NEXT_PERIOD, 260, 20)
    assert response.status_code == 200
    row = response.json()["data"]
    assert row["electric_old"] == 150
    assert row["water_old"] == 12

    invoices = client.get(
        f"{API}{Route.INVOICES}?{QueryParam.PERIOD}={NEXT_PERIOD}", headers=auth
    ).json()["data"]
    electric = next(
        line for line in invoices[0]["lines"] if line["code"] == ServiceCode.ELECTRICITY
    )
    assert electric["quantity"] == 110


def test_resaving_a_period_updates_rather_than_duplicates(
    client: TestClient, auth: dict[str, str]
) -> None:
    room_id = _occupied_room(client, auth)
    save_reading(client, auth, room_id, PERIOD, 150, 12)
    save_reading(client, auth, room_id, PERIOD, 200, 12)
    invoices = client.get(f"{API}{Route.INVOICES}", headers=auth).json()
    assert invoices["meta"]["total"] == 1
    assert invoices["data"][0]["total"] == EXPECTED_TOTAL + 50 * 3_500


def test_tabs_filter_the_grid(client: TestClient, auth: dict[str, str]) -> None:
    room_id = _occupied_room(client, auth)
    missing = client.get(
        f"{API}{Route.METERS}?{QueryParam.FILTER}={MeterFilter.MISSING_ELECTRIC}", headers=auth
    )
    assert len(missing.json()["data"]) == 1

    save_reading(client, auth, room_id, PERIOD, 150, 12)
    complete = client.get(
        f"{API}{Route.METERS}?{QueryParam.FILTER}={MeterFilter.COMPLETE}", headers=auth
    )
    assert len(complete.json()["data"]) == 1
    still_missing = client.get(
        f"{API}{Route.METERS}?{QueryParam.FILTER}={MeterFilter.MISSING_WATER}", headers=auth
    )
    assert still_missing.json()["data"] == []


def test_search_matches_room_number_and_tenant(
    client: TestClient, auth: dict[str, str]
) -> None:
    _occupied_room(client, auth)
    assert len(
        client.get(f"{API}{Route.METERS}?{QueryParam.SEARCH}=101", headers=auth).json()["data"]
    ) == 1
    assert len(
        client.get(f"{API}{Route.METERS}?{QueryParam.SEARCH}=nguyen", headers=auth).json()["data"]
    ) == 1
    assert client.get(
        f"{API}{Route.METERS}?{QueryParam.SEARCH}=zzz", headers=auth
    ).json()["data"] == []


def _issued_invoice(client: TestClient, auth: dict[str, str]) -> str:
    room_id = _occupied_room(client, auth)
    save_reading(client, auth, room_id, PERIOD, 150, 12)
    invoice_id: str = client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"][0]["id"]
    return invoice_id


def test_sending_marks_the_invoice_unpaid(client: TestClient, auth: dict[str, str]) -> None:
    invoice_id = _issued_invoice(client, auth)
    response = client.post(
        f"{API}{Route.INVOICE_SEND.format(invoice_id=invoice_id)}", headers=auth
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == InvoiceStatus.UNPAID
    assert response.json()["data"]["sent_at"] is not None


def test_a_resend_leaves_the_payment_state_alone(
    client: TestClient, auth: dict[str, str]
) -> None:
    invoice_id = _issued_invoice(client, auth)
    client.post(f"{API}{Route.INVOICE_SEND.format(invoice_id=invoice_id)}", headers=auth)
    client.patch(
        f"{API}{Route.INVOICE_PAYMENT.format(invoice_id=invoice_id)}",
        json={"paid_amount": EXPECTED_TOTAL},
        headers=auth,
    )
    response = client.post(
        f"{API}{Route.INVOICE_SEND.format(invoice_id=invoice_id)}", headers=auth
    )
    assert response.json()["data"]["status"] == InvoiceStatus.PAID


def test_payment_state_follows_the_amount(client: TestClient, auth: dict[str, str]) -> None:
    invoice_id = _issued_invoice(client, auth)
    path = f"{API}{Route.INVOICE_PAYMENT.format(invoice_id=invoice_id)}"

    partial = client.patch(path, json={"paid_amount": 1_000_000}, headers=auth)
    assert partial.json()["data"]["status"] == InvoiceStatus.PARTIALLY_PAID

    settled = client.patch(path, json={"paid_amount": EXPECTED_TOTAL}, headers=auth)
    assert settled.json()["data"]["status"] == InvoiceStatus.PAID


def test_overpayment_is_rejected(client: TestClient, auth: dict[str, str]) -> None:
    invoice_id = _issued_invoice(client, auth)
    response = client.patch(
        f"{API}{Route.INVOICE_PAYMENT.format(invoice_id=invoice_id)}",
        json={"paid_amount": EXPECTED_TOTAL + 1},
        headers=auth,
    )
    assert response.status_code == 400


def test_pdf_export_returns_a_pdf(client: TestClient, auth: dict[str, str]) -> None:
    invoice_id = _issued_invoice(client, auth)
    response = client.get(
        f"{API}{Route.INVOICE_PDF.format(invoice_id=invoice_id)}", headers=auth
    )
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")
