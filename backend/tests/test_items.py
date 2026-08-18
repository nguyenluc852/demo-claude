from fastapi import status
from fastapi.testclient import TestClient

from app.core.constants import Pagination, Route
from app.core.messages import ErrorCode
from tests.conftest import API

ITEMS_URL = f"{API}{Route.ITEMS}"
SAMPLE_NAME = "Widget"


def _create(client: TestClient, name: str = SAMPLE_NAME) -> int:
    response = client.post(ITEMS_URL, json={"name": name})
    assert response.status_code == status.HTTP_201_CREATED
    item_id: int = response.json()["data"]["id"]
    return item_id


def test_create_returns_created_item(client: TestClient) -> None:
    response = client.post(ITEMS_URL, json={"name": SAMPLE_NAME})

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["data"]["name"] == SAMPLE_NAME


def test_duplicate_name_conflicts(client: TestClient) -> None:
    _create(client)

    response = client.post(ITEMS_URL, json={"name": SAMPLE_NAME})

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["error"]["code"] == ErrorCode.CONFLICT


def test_missing_item_returns_not_found_envelope(client: TestClient) -> None:
    response = client.get(f"{ITEMS_URL}/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == ErrorCode.NOT_FOUND


def test_invalid_payload_returns_validation_envelope(client: TestClient) -> None:
    response = client.post(ITEMS_URL, json={"name": ""})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json()["error"]["code"] == ErrorCode.VALIDATION_ERROR


def test_list_is_paginated(client: TestClient) -> None:
    _create(client, "first")
    _create(client, "second")

    response = client.get(ITEMS_URL, params={"page": 1, "size": 1})

    body = response.json()
    assert len(body["data"]) == 1
    assert body["meta"] == {"page": 1, "size": 1, "total": 2}


def test_size_above_max_is_rejected(client: TestClient) -> None:
    response = client.get(ITEMS_URL, params={"size": Pagination.MAX_SIZE + 1})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_then_delete(client: TestClient) -> None:
    item_id = _create(client)

    updated = client.patch(f"{ITEMS_URL}/{item_id}", json={"description": "new"})
    assert updated.json()["data"]["description"] == "new"

    assert client.delete(f"{ITEMS_URL}/{item_id}").status_code == status.HTTP_204_NO_CONTENT
    assert client.get(f"{ITEMS_URL}/{item_id}").status_code == status.HTTP_404_NOT_FOUND
