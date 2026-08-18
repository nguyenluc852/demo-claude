"""Translation between Mongo documents and the Pydantic schemas the API returns."""

from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.common.exceptions import NotFoundError
from app.core.constants import Field


def to_object_id(value: str, not_found_message: str) -> ObjectId:
    """Reject a malformed id as a 404 — a bad id and a missing row read the same."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise NotFoundError(not_found_message) from exc


def serialize(document: dict[str, Any]) -> dict[str, Any]:
    """Replace Mongo's `_id` with the string `id` the response schemas declare."""
    result = dict(document)
    raw_id = result.pop(Field.ID, None)
    if raw_id is not None:
        result["id"] = str(raw_id)
    return result
