from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from app.core.config import settings
from app.core.constants import ApiPrefix, AuthScheme, Collection, Header, Route

# Point the whole suite at its own database BEFORE app.main imports anything that
# resolves it. The tests wipe every collection they touch, which must never be
# the database a running dev server is serving from.
settings.mongodb_db = f"{settings.mongodb_db}_test"

# Same reasoning for outbound mail. Signing a contract sends a verification
# email, so a developer with real SMTP credentials in .env would have the suite
# mail strangers from their own account on every run. Clearing the host makes
# services/email.py log the message instead — the flows still run end to end.
settings.smtp_host = ""

from app.main import app  # noqa: E402  (import order is deliberate, see above)
from app.services.item import item_service  # noqa: E402

API = f"{ApiPrefix.ROOT}{ApiPrefix.V1}"

ADMIN_EMAIL = "admin@motel.example.com"
ADMIN_PASSWORD = "admin123"

_MANAGED_COLLECTIONS = (
    Collection.USERS,
    Collection.ROOMS,
    Collection.CONTRACTS,
    Collection.METER_READINGS,
    Collection.INVOICES,
    Collection.LEADS,
)


@pytest.fixture
def mongo_database() -> Iterator[Any]:
    """Direct database access, for asserting on rows the API does not expose."""
    mongo: MongoClient[dict[str, Any]] = MongoClient(settings.mongodb_url)
    yield mongo[settings.mongodb_db]
    mongo.close()


@pytest.fixture(autouse=True)
def clean_database() -> Iterator[None]:
    """Empty every collection the tests write to, so cases stay independent.

    Services are left alone: the lifespan seeds the default price list once and
    the invoice tests bill against it.
    """
    mongo: MongoClient[dict[str, Any]] = MongoClient(settings.mongodb_url)
    database = mongo[settings.mongodb_db]
    for name in _MANAGED_COLLECTIONS:
        database[name].delete_many({})
    yield
    mongo.close()


@pytest.fixture
def client() -> Iterator[TestClient]:
    """Fresh client with the item store reset, so tests stay independent."""
    item_service._items.clear()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_token(client: TestClient) -> str:
    response = client.post(
        f"{API}{Route.AUTH_REGISTER}",
        json={"username": "admin", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 201
    token: str = response.json()["data"]["access_token"]
    return token


@pytest.fixture
def auth(admin_token: str) -> dict[str, str]:
    return {Header.AUTHORIZATION: f"{AuthScheme.BEARER} {admin_token}"}
