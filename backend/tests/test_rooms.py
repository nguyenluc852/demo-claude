from fastapi.testclient import TestClient

from app.core.constants import RoomStatus, Route
from app.core.messages import ErrorCode
from tests.conftest import API
from tests.factories import create_contract, create_room


def test_create_and_read_room(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    response = client.get(f"{API}{Route.ROOM_DETAIL.format(room_id=room['id'])}", headers=auth)
    assert response.status_code == 200
    assert response.json()["data"]["room_number"] == "101"
    assert response.json()["data"]["status"] == RoomStatus.AVAILABLE


def test_room_number_must_be_unique(client: TestClient, auth: dict[str, str]) -> None:
    create_room(client, auth, room_number="201")
    response = client.post(
        f"{API}{Route.ROOMS}",
        json={
            "room_number": "201",
            "floor": 2,
            "room_type": "studio",
            "area": 20.0,
            "base_price": 2_000_000,
        },
        headers=auth,
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == ErrorCode.CONFLICT


def test_update_replaces_the_image_gallery(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    images = ["https://example.com/a.jpg", "https://example.com/b.jpg"]
    response = client.patch(
        f"{API}{Route.ROOM_DETAIL.format(room_id=room['id'])}",
        json={"images": images},
        headers=auth,
    )
    assert response.status_code == 200
    assert response.json()["data"]["images"] == images


def test_unknown_id_reads_as_not_found(client: TestClient, auth: dict[str, str]) -> None:
    response = client.get(f"{API}{Route.ROOM_DETAIL.format(room_id='not-an-id')}", headers=auth)
    assert response.status_code == 404


def test_occupied_room_cannot_be_deleted(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    response = client.delete(
        f"{API}{Route.ROOM_DETAIL.format(room_id=room['id'])}", headers=auth
    )
    assert response.status_code == 409


def test_grid_carries_the_current_tenant(client: TestClient, auth: dict[str, str]) -> None:
    room = create_room(client, auth)
    create_contract(client, auth, room["id"])
    response = client.get(f"{API}{Route.ROOMS_GRID}", headers=auth)
    assert response.status_code == 200
    entry = response.json()["data"][0]
    assert entry["status"] == RoomStatus.OCCUPIED
    assert entry["occupancy"]["tenant_name"] == "Nguyen Van A"
