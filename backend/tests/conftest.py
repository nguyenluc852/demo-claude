from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.constants import ApiPrefix
from app.main import app
from app.services.item import item_service

API = f"{ApiPrefix.ROOT}{ApiPrefix.V1}"


@pytest.fixture
def client() -> Iterator[TestClient]:
    """Fresh client with the item store reset, so tests stay independent."""
    item_service._items.clear()
    with TestClient(app) as test_client:
        yield test_client
