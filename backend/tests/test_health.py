from fastapi import status
from fastapi.testclient import TestClient

from app.core.constants import AppMeta, Route
from app.core.messages import HealthStatus
from tests.conftest import API


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get(f"{API}{Route.HEALTH}")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["data"] == {
        "status": HealthStatus.OK,
        "version": AppMeta.VERSION,
    }
