"""Builders for the documents most tests need before they can assert anything."""

from typing import Any

from fastapi.testclient import TestClient

from app.core.constants import PaymentCycle, RoomType, Route
from tests.conftest import API


def create_room(
    client: TestClient, auth: dict[str, str], room_number: str = "101", **overrides: Any
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "room_number": room_number,
        "floor": 1,
        "room_type": RoomType.STUDIO,
        "area": 25.0,
        "base_price": 3_000_000,
        "amenities": ["Dieu hoa"],
        "images": ["https://example.com/room.jpg"],
        **overrides,
    }
    response = client.post(f"{API}{Route.ROOMS}", json=payload, headers=auth)
    assert response.status_code == 201, response.text
    result: dict[str, Any] = response.json()["data"]
    return result


def create_contract(
    client: TestClient, auth: dict[str, str], room_id: str, **overrides: Any
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "room_id": room_id,
        "tenant_name": "Nguyen Van A",
        "tenant_id_card": "001234567",
        "tenant_phone": "0912345678",
        "tenant_email": "tenant@example.com",
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2027-01-01T00:00:00Z",
        "deposit": 3_000_000,
        "payment_cycle": PaymentCycle.MONTHLY,
        "occupants": 2,
        **overrides,
    }
    response = client.post(f"{API}{Route.CONTRACTS}", json=payload, headers=auth)
    assert response.status_code == 201, response.text
    result: dict[str, Any] = response.json()["data"]
    return result


def save_reading(
    client: TestClient,
    auth: dict[str, str],
    room_id: str,
    period: str,
    electric: float | None,
    water: float | None,
) -> Any:
    return client.put(
        f"{API}{Route.METER_DETAIL.format(room_id=room_id)}",
        json={"period": period, "electric_new": electric, "water_new": water},
        headers=auth,
    )
