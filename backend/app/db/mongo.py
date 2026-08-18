"""Single Motor client for the process, plus the index set the queries rely on.

`connect()` / `close()` are driven by the FastAPI lifespan in main.py. Services
reach collections through `get_collection()` so no module holds a stale handle
across a reconnect.
"""

from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase

from app.core.config import settings
from app.core.constants import Collection, Field

_client: AsyncIOMotorClient[dict[str, Any]] | None = None


async def connect() -> None:
    """Open the client and make sure every index the app queries by exists."""
    global _client
    if _client is not None:
        return
    _client = AsyncIOMotorClient(settings.mongodb_url)
    await _ensure_indexes(_client[settings.mongodb_db])


async def close() -> None:
    global _client
    if _client is None:
        return
    _client.close()
    _client = None


def get_database() -> AsyncIOMotorDatabase[dict[str, Any]]:
    if _client is None:
        raise RuntimeError("Mongo client is not connected")
    return _client[settings.mongodb_db]


def get_collection(name: str) -> AsyncIOMotorCollection[dict[str, Any]]:
    return get_database()[name]


async def _ensure_indexes(db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
    await db[Collection.USERS].create_index(Field.EMAIL, unique=True)
    await db[Collection.USERS].create_index(Field.USERNAME, unique=True)
    await db[Collection.USERS].create_index(Field.VERIFICATION_TOKEN, sparse=True)

    await db[Collection.ROOMS].create_index(Field.ROOM_NUMBER, unique=True)
    await db[Collection.ROOMS].create_index(Field.STATUS)

    await db[Collection.CONTRACTS].create_index(Field.ROOM_ID)
    await db[Collection.CONTRACTS].create_index(Field.STATUS)
    await db[Collection.CONTRACTS].create_index(Field.EMAIL)

    await db[Collection.METER_READINGS].create_index(
        [(Field.ROOM_ID, 1), (Field.PERIOD, 1)], unique=True
    )

    await db[Collection.INVOICES].create_index(
        [(Field.ROOM_ID, 1), (Field.PERIOD, 1)], unique=True
    )
    await db[Collection.INVOICES].create_index(Field.STATUS)
    await db[Collection.INVOICES].create_index(Field.CONTRACT_ID)

    await db[Collection.SERVICES].create_index(Field.CODE, unique=True)

    await db[Collection.LEADS].create_index(Field.CREATED_AT)
