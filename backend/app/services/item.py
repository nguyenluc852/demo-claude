"""Business logic for items.

Routers stay thin: they validate input and delegate here. Swap the in-memory
store for a database repository without touching the router layer.
"""

from itertools import count

from app.common.exceptions import ConflictError, NotFoundError
from app.core.messages import ErrorMessage
from app.schemas.item import ItemCreate, ItemSchema, ItemUpdate


class ItemService:
    def __init__(self) -> None:
        self._items: dict[int, ItemSchema] = {}
        self._ids = count(1)

    def list(self, offset: int, limit: int) -> tuple[list[ItemSchema], int]:
        ordered = sorted(self._items.values(), key=lambda item: item.id)
        return ordered[offset : offset + limit], len(ordered)

    def get(self, item_id: int) -> ItemSchema:
        item = self._items.get(item_id)
        if item is None:
            raise NotFoundError(ErrorMessage.ITEM_NOT_FOUND)
        return item

    def create(self, payload: ItemCreate) -> ItemSchema:
        if any(existing.name == payload.name for existing in self._items.values()):
            raise ConflictError(ErrorMessage.ITEM_NAME_TAKEN)

        item = ItemSchema(id=next(self._ids), **payload.model_dump())
        self._items[item.id] = item
        return item

    def update(self, item_id: int, payload: ItemUpdate) -> ItemSchema:
        item = self.get(item_id)
        updated = item.model_copy(update=payload.model_dump(exclude_unset=True))
        self._items[item_id] = updated
        return updated

    def delete(self, item_id: int) -> None:
        self.get(item_id)
        del self._items[item_id]


item_service = ItemService()
