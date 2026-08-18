from fastapi.testclient import TestClient

from app.core.constants import Route, UserRole
from app.core.messages import ErrorCode
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD, API


def test_register_returns_admin_token(client: TestClient) -> None:
    response = client.post(
        f"{API}{Route.AUTH_REGISTER}",
        json={"username": "owner", "email": "owner@example.com", "password": "secret123"},
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["user"]["role"] == UserRole.ADMIN
    assert data["access_token"]


def test_register_rejects_duplicate_email(client: TestClient, admin_token: str) -> None:
    response = client.post(
        f"{API}{Route.AUTH_REGISTER}",
        json={"username": "other", "email": ADMIN_EMAIL, "password": "secret123"},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == ErrorCode.CONFLICT


def test_login_rejects_wrong_password(client: TestClient, admin_token: str) -> None:
    response = client.post(
        f"{API}{Route.AUTH_LOGIN}", json={"email": ADMIN_EMAIL, "password": "wrong-password"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == ErrorCode.UNAUTHORIZED


def test_me_returns_the_caller(client: TestClient, auth: dict[str, str]) -> None:
    response = client.get(f"{API}{Route.AUTH_ME}", headers=auth)
    assert response.status_code == 200
    assert response.json()["data"]["email"] == ADMIN_EMAIL


def test_cms_requires_a_token(client: TestClient) -> None:
    assert client.get(f"{API}{Route.ROOMS}").status_code == 401


def test_login_succeeds_after_register(client: TestClient, admin_token: str) -> None:
    response = client.post(
        f"{API}{Route.AUTH_LOGIN}", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200
