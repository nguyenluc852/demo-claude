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

    invoices = client.get(f"{API}{Route.TENANT_INVOICES}", headers=headers)
    assert invoices.json()["meta"]["total"] == 1
    assert invoices.json()["data"][0]["status"] == InvoiceStatus.DRAFT


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
