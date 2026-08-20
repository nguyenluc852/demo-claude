"""The visitor-facing surface, the tenant portal, and the dashboard aggregates."""

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
EXPECTED_TOTAL = 4_005_000


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
