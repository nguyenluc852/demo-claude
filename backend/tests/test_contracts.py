from typing import Any

from fastapi.testclient import TestClient

from app.common.exceptions import EmailDeliveryError
from app.core.constants import Collection, ContractStatus, Field, RoomStatus, Route, UserRole
from app.core.messages import EmailTemplate, ErrorCode
from app.services import auth as auth_service_module
from tests.conftest import API
from tests.factories import create_contract, create_room


def _room_status(client: TestClient, auth: dict[str, str], room_id: str) -> str:
    response = client.get(f"{API}{Route.ROOM_DETAIL.format(room_id=room_id)}", headers=auth)
    status: str = response.json()["data"]["status"]
    return status


def test_signing_a_contract_occupies_the_room(
    client: TestClient, auth: dict[str, str]
) -> None:
    room = create_room(client, auth)
    contract = create_contract(client, auth, room["id"])
    assert contract["status"] == ContractStatus.ACTIVE
    assert _room_status(client, auth, room["id"]) == RoomStatus.OCCUPIED


def test_signing_provisions_an_unverified_tenant_login(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])

    account = mongo_database[Collection.USERS].find_one({Field.EMAIL: "tenant@example.com"})
    assert account is not None
    assert account[Field.ROLE] == UserRole.TENANT
    assert account["email_verified"] is False
    assert account[Field.USERNAME] == "tenant@example.com"


def test_one_room_cannot_hold_two_live_contracts(
    client: TestClient, auth: dict[str, str]
) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    response = client.post(
        f"{API}{Route.CONTRACTS}",
        json={
            "room_id": room["id"],
            "tenant_name": "Nguyen Van B",
            "tenant_id_card": "007654321",
            "tenant_phone": "0900000000",
            "tenant_email": "second@example.com",
            "start_date": "2026-02-01T00:00:00Z",
            "end_date": "2027-02-01T00:00:00Z",
            "deposit": 1_000_000,
        },
        headers=auth,
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == ErrorCode.CONFLICT


def test_end_date_must_follow_start_date(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    response = client.post(
        f"{API}{Route.CONTRACTS}",
        json={
            "room_id": room["id"],
            "tenant_name": "Nguyen Van C",
            "tenant_id_card": "003333333",
            "tenant_phone": "0911111111",
            "tenant_email": "third@example.com",
            "start_date": "2027-01-01T00:00:00Z",
            "end_date": "2026-01-01T00:00:00Z",
            "deposit": 0,
        },
        headers=auth,
    )
    assert response.status_code == 422


def test_changing_the_email_resets_verification(
    client: TestClient, auth: dict[str, str], mongo_database: Any
) -> None:
    room = create_room(client, auth)
    contract = create_contract(client, auth, room["id"])
    mongo_database[Collection.USERS].update_one(
        {Field.EMAIL: "tenant@example.com"}, {"$set": {"email_verified": True}}
    )

    response = client.patch(
        f"{API}{Route.CONTRACT_DETAIL.format(contract_id=contract['id'])}",
        json={"tenant_email": "moved@example.com"},
        headers=auth,
    )
    assert response.status_code == 200
    assert response.json()["data"]["email_verified"] is False

    account = mongo_database[Collection.USERS].find_one({Field.EMAIL: "moved@example.com"})
    assert account is not None
    assert account[Field.VERIFICATION_TOKEN]


def test_terminating_frees_the_room(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    contract = create_contract(client, auth, room["id"])
    client.patch(
        f"{API}{Route.CONTRACT_DETAIL.format(contract_id=contract['id'])}",
        json={"status": ContractStatus.TERMINATED},
        headers=auth,
    )
    assert _room_status(client, auth, room["id"]) == RoomStatus.AVAILABLE


def test_deleting_frees_the_room(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    contract = create_contract(client, auth, room["id"])
    response = client.delete(
        f"{API}{Route.CONTRACT_DETAIL.format(contract_id=contract['id'])}", headers=auth
    )
    assert response.status_code == 204
    assert _room_status(client, auth, room["id"]) == RoomStatus.AVAILABLE


# --- Signing must survive a mail provider that refuses the message -----------
#
# The contract, the room status and the tenant account are three separate
# writes with no transaction around them. Raising out of the verification mail
# reported a failure for work that had already landed, and the retry then hit
# "room already occupied". These cases pin the mail step as best-effort.


def _broken_mailer(monkeypatch: Any) -> None:
    """Make every outbound message fail the way a rejected sender domain does."""

    async def refuse(*_: Any, **__: Any) -> None:
        raise EmailDeliveryError

    monkeypatch.setattr(auth_service_module, "send_email", refuse)


def _recording_mailer(monkeypatch: Any) -> list[tuple[str, str, str]]:
    sent: list[tuple[str, str, str]] = []

    async def record(to: str, subject: str, html_body: str) -> None:
        sent.append((to, subject, html_body))

    monkeypatch.setattr(auth_service_module, "send_email", record)
    return sent


def test_signing_succeeds_even_when_the_verification_email_is_refused(
    client: TestClient, auth: dict[str, str], mongo_database: Any, monkeypatch: Any
) -> None:
    _broken_mailer(monkeypatch)
    room = create_room(client, auth)

    contract = create_contract(client, auth, room["id"])

    assert contract["status"] == ContractStatus.ACTIVE
    assert contract["email_verified"] is False
    assert _room_status(client, auth, room["id"]) == RoomStatus.OCCUPIED

    stored = mongo_database[Collection.CONTRACTS].find_one({Field.ROOM_ID: room["id"]})
    assert stored is not None

    account = mongo_database[Collection.USERS].find_one({Field.EMAIL: "tenant@example.com"})
    assert account is not None
    assert account[Field.ROLE] == UserRole.TENANT
    assert account["email_verified"] is False


def test_changing_the_email_succeeds_when_the_mail_is_refused(
    client: TestClient, auth: dict[str, str], mongo_database: Any, monkeypatch: Any
) -> None:
    room = create_room(client, auth)
    contract = create_contract(client, auth, room["id"])
    mongo_database[Collection.USERS].update_one(
        {Field.EMAIL: "tenant@example.com"}, {"$set": {"email_verified": True}}
    )
    _broken_mailer(monkeypatch)

    response = client.patch(
        f"{API}{Route.CONTRACT_DETAIL.format(contract_id=contract['id'])}",
        json={"tenant_email": "moved@example.com"},
        headers=auth,
    )

    assert response.status_code == 200, response.text
    assert response.json()["data"]["tenant_email"] == "moved@example.com"
    assert response.json()["data"]["email_verified"] is False

    account = mongo_database[Collection.USERS].find_one({Field.EMAIL: "moved@example.com"})
    assert account is not None
    assert account["email_verified"] is False


def test_a_working_mailer_still_sends_exactly_one_link_to_the_tenant(
    client: TestClient, auth: dict[str, str], monkeypatch: Any
) -> None:
    sent = _recording_mailer(monkeypatch)
    room = create_room(client, auth)

    create_contract(client, auth, room["id"])

    assert len(sent) == 1
    assert sent[0][0] == "tenant@example.com"
    assert sent[0][1] == EmailTemplate.VERIFY_SUBJECT


def test_a_broken_mailer_does_not_swallow_the_occupied_room_conflict(
    client: TestClient, auth: dict[str, str], monkeypatch: Any
) -> None:
    """Only delivery failures are tolerated; every other error still surfaces."""
    _broken_mailer(monkeypatch)
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])

    response = client.post(
        f"{API}{Route.CONTRACTS}",
        json={
            "room_id": room["id"],
            "tenant_name": "Nguyen Van D",
            "tenant_id_card": "004444444",
            "tenant_phone": "0944444444",
            "tenant_email": "fourth@example.com",
            "start_date": "2026-02-01T00:00:00Z",
            "end_date": "2027-02-01T00:00:00Z",
            "deposit": 0,
        },
        headers=auth,
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == ErrorCode.CONFLICT
