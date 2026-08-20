"""The visitor-facing surface, the tenant portal, and the dashboard aggregates."""

from datetime import UTC, datetime
from typing import Any

from fastapi.testclient import TestClient

from app.core.constants import (
    AuthScheme,
    Collection,
    Field,
    Header,
    InvoiceStatus,
    QueryParam,
    Route,
    UserRole,
)
from app.core.messages import ErrorMessage
from tests.conftest import API
from tests.factories import create_contract, create_room, save_reading

PERIOD = "2026-08"
EARLIER_PERIOD = "2026-07"
EXPECTED_TOTAL = 4_005_000
PART_PAYMENT = 1_000_000
# Deliberately the older period's, so a balance that reports the newest invoice's
# due date instead of the earliest one fails.
EARLIEST_DUE = datetime(2026, 8, 5, tzinfo=UTC)
LATEST_DUE = datetime(2026, 9, 5, tzinfo=UTC)


def test_homepage_lists_rooms_without_a_token(
    client: TestClient, auth: dict[str, str]
) -> None:
    create_room(client, auth)
    response = client.get(f"{API}{Route.PUBLIC_ROOMS}")
    assert response.status_code == 200
    room = response.json()["data"][0]
    assert room["room_number"] == "101"
    # Operational fields must not leak to visitors.
    assert "created_at" not in room


def test_contact_form_records_a_lead(client: TestClient, auth: dict[str, str]) -> None:
    submitted = client.post(
        f"{API}{Route.PUBLIC_LEADS}",
        json={"name": "Khach", "phone": "0900000000", "email": "khach@example.com"},
    )
    assert submitted.status_code == 201

    listed = client.get(f"{API}{Route.LEADS}", headers=auth)
    assert listed.json()["meta"]["total"] == 1
    assert listed.json()["data"][0]["name"] == "Khach"


def test_lead_listing_needs_a_token(client: TestClient) -> None:
    assert client.get(f"{API}{Route.LEADS}").status_code == 401


def test_summary_counts_rooms_and_money(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    create_room(client, auth, room_number="102")
    save_reading(client, auth, room["id"], PERIOD, 150, 12)

    data = client.get(f"{API}{Route.DASHBOARD_SUMMARY}", headers=auth).json()["data"]
    assert data["total_rooms"] == 2
    assert data["occupied_rooms"] == 1
    assert data["available_rooms"] == 1
    assert data["active_contracts"] == 1
    assert data["unpaid_invoices"] == 1
    assert data["outstanding_amount"] == EXPECTED_TOTAL


def test_revenue_splits_rent_from_services(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    save_reading(client, auth, room["id"], PERIOD, 150, 12)

    data = client.get(
        f"{API}{Route.DASHBOARD_REVENUE}?{QueryParam.MONTHS}=12", headers=auth
    ).json()["data"]
    assert len(data["points"]) == 12
    billed = next(point for point in data["points"] if point["period"] == PERIOD)
    assert billed["room_revenue"] == 3_000_000
    assert billed["service_revenue"] == EXPECTED_TOTAL - 3_000_000
    assert billed["total_revenue"] == EXPECTED_TOTAL


def _verified_tenant_token(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> str:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    save_reading(client, auth, room["id"], PERIOD, 150, 12)

    account = mongo_database[Collection.USERS].find_one({Field.EMAIL: "tenant@example.com"})
    client.post(
        f"{API}{Route.AUTH_VERIFY}?{QueryParam.TOKEN}={account[Field.VERIFICATION_TOKEN]}"
    )
    login = client.post(
        f"{API}{Route.AUTH_LOGIN}",
        json={"email": "tenant@example.com", "password": "0912345678"},
    )
    assert login.status_code == 200
    token: str = login.json()["data"]["access_token"]
    return token


def test_tenant_cannot_log_in_before_verifying(
    client: TestClient, auth: dict[str, str]
) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    response = client.post(
        f"{API}{Route.AUTH_LOGIN}",
        json={"email": "tenant@example.com", "password": "0912345678"},
    )
    assert response.status_code == 401


def test_verified_tenant_sees_only_their_own_data(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    token = _verified_tenant_token(client, auth, mongo_database)
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}

    overview = client.get(f"{API}{Route.TENANT_ME}", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["data"]["contract"]["tenant_name"] == "Nguyen Van A"
    assert overview.json()["data"]["room"]["room_number"] == "101"

    # The reading above billed a draft invoice for this very contract, yet the
    # portal reports nothing: only InvoiceStatus.TENANT_VISIBLE reaches a tenant.
    # Drop that filter and this count goes back to 1 instead of failing quietly.
    invoices = client.get(f"{API}{Route.TENANT_INVOICES}", headers=headers)
    assert invoices.json()["meta"]["total"] == 0
    assert invoices.json()["data"] == []


def test_tenant_never_sees_a_draft_invoice(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    """A draft is not issued yet, so the portal must hide it — count included.

    The count is the easy half to get wrong: a filtered page with an unfiltered
    count_documents would still tell the tenant an invoice exists.
    """
    token = _verified_tenant_token(client, auth, mongo_database)
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}

    staff_view = client.get(f"{API}{Route.INVOICES}", headers=auth).json()
    assert staff_view["data"][0][Field.STATUS] == InvoiceStatus.DRAFT

    tenant_view = client.get(f"{API}{Route.TENANT_INVOICES}", headers=headers).json()
    assert tenant_view["data"] == []
    assert tenant_view["meta"]["total"] == 0


def test_tenant_sees_an_invoice_once_it_has_been_sent(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    token = _verified_tenant_token(client, auth, mongo_database)
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}

    draft = client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"][0]
    sent = client.post(
        f"{API}{Route.INVOICE_SEND.format(invoice_id=draft['id'])}", headers=auth
    )
    assert sent.status_code == 200
    assert sent.json()["data"][Field.STATUS] == InvoiceStatus.UNPAID

    listed = client.get(f"{API}{Route.TENANT_INVOICES}", headers=headers).json()
    assert listed["meta"]["total"] == 1
    assert listed["data"][0][Field.STATUS] == InvoiceStatus.UNPAID


def test_tenant_keeps_seeing_partially_paid_and_paid_invoices(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    token = _verified_tenant_token(client, auth, mongo_database)
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}

    invoice = client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"][0]
    client.post(f"{API}{Route.INVOICE_SEND.format(invoice_id=invoice['id'])}", headers=auth)
    payment_url = f"{API}{Route.INVOICE_PAYMENT.format(invoice_id=invoice['id'])}"

    for amount, expected in (
        (EXPECTED_TOTAL / 2, InvoiceStatus.PARTIALLY_PAID),
        (EXPECTED_TOTAL, InvoiceStatus.PAID),
    ):
        paid = client.patch(payment_url, json={"paid_amount": amount}, headers=auth)
        assert paid.json()["data"][Field.STATUS] == expected

        listed = client.get(f"{API}{Route.TENANT_INVOICES}", headers=headers).json()
        assert listed["meta"]["total"] == 1
        assert listed["data"][0][Field.STATUS] == expected


def _tenant_headers(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> dict[str, str]:
    token = _verified_tenant_token(client, auth, mongo_database)
    return {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}


def _invoice_for(
    client: TestClient, auth: dict[str, str], period: str, room_number: str = "101"
) -> dict[str, Any]:
    listed = client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"]
    return next(
        row
        for row in listed
        if row[Field.PERIOD] == period and row[Field.ROOM_NUMBER] == room_number
    )


def _send(client: TestClient, auth: dict[str, str], invoice: dict[str, Any]) -> None:
    response = client.post(
        f"{API}{Route.INVOICE_SEND.format(invoice_id=invoice['id'])}", headers=auth
    )
    assert response.status_code == 200, response.text


def _pay(
    client: TestClient, auth: dict[str, str], invoice: dict[str, Any], amount: float
) -> dict[str, Any]:
    response = client.patch(
        f"{API}{Route.INVOICE_PAYMENT.format(invoice_id=invoice['id'])}",
        json={"paid_amount": amount},
        headers=auth,
    )
    assert response.status_code == 200, response.text
    paid: dict[str, Any] = response.json()["data"]
    return paid


def _two_period_tenant(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> tuple[dict[str, str], dict[str, Any], dict[str, Any]]:
    """A verified tenant billed for two periods, oldest returned first.

    The earlier period is added after the later one on purpose: the balance must
    order by period, not by the order the invoices happened to be written in.
    """
    headers = _tenant_headers(client, auth, mongo_database)
    newest = _invoice_for(client, auth, PERIOD)
    save_reading(client, auth, newest[Field.ROOM_ID], EARLIER_PERIOD, 100, 8)
    oldest = _invoice_for(client, auth, EARLIER_PERIOD)
    return headers, oldest, newest


def _set_due_dates(mongo_database: Any, room_id: str) -> None:
    invoices = mongo_database[Collection.INVOICES]
    for period, due in ((EARLIER_PERIOD, EARLIEST_DUE), (PERIOD, LATEST_DUE)):
        invoices.update_one(
            {Field.ROOM_ID: room_id, Field.PERIOD: period},
            {"$set": {Field.DUE_DATE: due}},
        )


def _balance(client: TestClient, headers: dict[str, str]) -> dict[str, Any]:
    response = client.get(f"{API}{Route.TENANT_ME}", headers=headers)
    assert response.status_code == 200, response.text
    balance: dict[str, Any] = response.json()["data"]["balance"]
    return balance


def test_balance_splits_a_part_paid_older_invoice_from_the_current_one(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    """The case the split exists for: previous_due is the remainder, not the total.

    An older invoice that was half settled still owes the difference; summing its
    full amount would over-report, and dropping it would under-report.
    """
    headers, oldest, newest = _two_period_tenant(client, auth, mongo_database)
    _send(client, auth, oldest)
    _send(client, auth, newest)

    paid = _pay(client, auth, oldest, PART_PAYMENT)
    assert paid[Field.STATUS] == InvoiceStatus.PARTIALLY_PAID

    remaining = oldest[Field.TOTAL] - PART_PAYMENT
    balance = _balance(client, headers)
    assert balance["current_due"] == newest[Field.TOTAL]
    assert balance["previous_due"] == remaining
    assert balance["outstanding"] == newest[Field.TOTAL] + remaining
    assert balance["current_period"] == PERIOD
    assert balance["unpaid_count"] == 2


def test_balance_leaves_out_a_fully_paid_invoice(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    headers, oldest, newest = _two_period_tenant(client, auth, mongo_database)
    _send(client, auth, oldest)
    _send(client, auth, newest)

    paid = _pay(client, auth, oldest, oldest[Field.TOTAL])
    assert paid[Field.STATUS] == InvoiceStatus.PAID

    balance = _balance(client, headers)
    assert balance["outstanding"] == newest[Field.TOTAL]
    assert balance["current_due"] == newest[Field.TOTAL]
    assert balance["previous_due"] == 0
    assert balance["unpaid_count"] == 1


def test_balance_leaves_out_a_draft_invoice(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    """A draft is not issued, so it is not owed — same rule as the invoice list."""
    headers, oldest, newest = _two_period_tenant(client, auth, mongo_database)
    _send(client, auth, newest)
    assert _invoice_for(client, auth, EARLIER_PERIOD)[Field.STATUS] == InvoiceStatus.DRAFT

    balance = _balance(client, headers)
    assert balance["outstanding"] == newest[Field.TOTAL]
    assert balance["previous_due"] == 0
    assert balance["unpaid_count"] == 1
    assert oldest[Field.TOTAL] > 0  # the draft had a real amount and was still skipped


def test_balance_is_empty_when_nothing_is_owed(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    headers, oldest, newest = _two_period_tenant(client, auth, mongo_database)
    for invoice in (oldest, newest):
        _send(client, auth, invoice)
        _pay(client, auth, invoice, invoice[Field.TOTAL])

    balance = _balance(client, headers)
    assert balance["outstanding"] == 0
    assert balance["current_due"] == 0
    assert balance["previous_due"] == 0
    assert balance["unpaid_count"] == 0
    assert balance[Field.DUE_DATE] is None
    assert balance["current_period"] is None


def test_balance_reports_the_earliest_due_date_not_the_newest_periods(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    headers, oldest, newest = _two_period_tenant(client, auth, mongo_database)
    _send(client, auth, oldest)
    _send(client, auth, newest)
    _set_due_dates(mongo_database, newest[Field.ROOM_ID])

    due = datetime.fromisoformat(_balance(client, headers)[Field.DUE_DATE])
    assert due.replace(tzinfo=UTC) == EARLIEST_DUE


def test_balance_counts_only_the_tenants_own_contract(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    headers, oldest, newest = _two_period_tenant(client, auth, mongo_database)

    neighbour = create_room(client, auth, room_number="102")
    create_contract(
        client,
        auth,
        neighbour["id"],
        tenant_email="other@example.com",
        tenant_phone="0987654321",
    )
    save_reading(client, auth, neighbour["id"], PERIOD, 200, 20)

    for invoice in client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"]:
        _send(client, auth, invoice)

    balance = _balance(client, headers)
    assert balance["unpaid_count"] == 2
    assert balance["outstanding"] == oldest[Field.TOTAL] + newest[Field.TOTAL]


def test_staff_invoice_list_still_shows_drafts(
    client: TestClient, auth: dict[str, str]
) -> None:
    """Hiding drafts from the tenant must not thin out the CMS screen."""
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    save_reading(client, auth, room["id"], PERIOD, 150, 12)

    listed = client.get(f"{API}{Route.INVOICES}", headers=auth).json()
    assert listed["meta"]["total"] == 1
    assert listed["data"][0][Field.STATUS] == InvoiceStatus.DRAFT

    filtered = client.get(
        f"{API}{Route.INVOICES}?{QueryParam.STATUS}={InvoiceStatus.DRAFT}", headers=auth
    ).json()
    assert filtered["meta"]["total"] == 1


def test_tenant_does_not_see_another_contracts_sent_invoice(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    token = _verified_tenant_token(client, auth, mongo_database)
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}

    neighbour = create_room(client, auth, room_number="102")
    create_contract(
        client, auth, neighbour["id"], tenant_email="other@example.com", tenant_phone="0987654321"
    )
    save_reading(client, auth, neighbour["id"], PERIOD, 200, 20)

    for invoice in client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"]:
        client.post(
            f"{API}{Route.INVOICE_SEND.format(invoice_id=invoice['id'])}", headers=auth
        )

    listed = client.get(f"{API}{Route.TENANT_INVOICES}", headers=headers).json()
    assert listed["meta"]["total"] == 1
    assert {row["room_number"] for row in listed["data"]} == {"101"}


def test_tenant_account_without_a_contract_gets_the_shared_message(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    token = _verified_tenant_token(client, auth, mongo_database)
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}
    mongo_database[Collection.USERS].update_one(
        {Field.EMAIL: "tenant@example.com"}, {"$set": {Field.CONTRACT_ID: None}}
    )

    response = client.get(f"{API}{Route.TENANT_INVOICES}", headers=headers)
    assert response.status_code == 404
    assert response.json()["error"]["message"] == ErrorMessage.TENANT_NO_CONTRACT


def test_tenant_is_locked_out_of_the_cms(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    token = _verified_tenant_token(client, auth, mongo_database)
    headers = {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {token}"}
    assert client.get(f"{API}{Route.ROOMS}", headers=headers).status_code == 403
    assert client.get(f"{API}{Route.USERS}", headers=headers).status_code == 403


def test_admin_lists_and_deletes_accounts(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    _verified_tenant_token(client, auth, mongo_database)
    listed = client.get(f"{API}{Route.USERS}", headers=auth).json()
    assert listed["meta"]["total"] == 2

    tenant = next(u for u in listed["data"] if u["role"] == UserRole.TENANT)
    assert client.delete(
        f"{API}{Route.USER_DETAIL.format(user_id=tenant['id'])}", headers=auth
    ).status_code == 204


def test_admin_cannot_delete_their_own_account(
    client: TestClient, auth: dict[str, str]
) -> None:
    me = client.get(f"{API}{Route.AUTH_ME}", headers=auth).json()["data"]
    response = client.delete(
        f"{API}{Route.USER_DETAIL.format(user_id=me['id'])}", headers=auth
    )
    assert response.status_code == 400


def test_price_changes_do_not_rewrite_issued_invoices(
    client: TestClient, auth: dict[str, str]
) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    save_reading(client, auth, room["id"], PERIOD, 150, 12)

    services = client.get(f"{API}{Route.SERVICES}", headers=auth).json()["data"]
    electricity = next(s for s in services if s["code"] == "electricity")
    client.patch(
        f"{API}{Route.SERVICE_DETAIL.format(service_id=electricity['id'])}",
        json={"unit_price": 9_999},
        headers=auth,
    )

    invoice = client.get(f"{API}{Route.INVOICES}", headers=auth).json()["data"][0]
    billed = next(line for line in invoice["lines"] if line["code"] == "electricity")
    assert billed["unit_price"] == 3_500
    assert invoice["total"] == EXPECTED_TOTAL

    # Restore the seeded price so the shared services collection stays stable.
    client.patch(
        f"{API}{Route.SERVICE_DETAIL.format(service_id=electricity['id'])}",
        json={"unit_price": 3_500},
        headers=auth,
    )
