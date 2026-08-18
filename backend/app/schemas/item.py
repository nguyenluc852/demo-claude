from pydantic import BaseModel, ConfigDict, Field


class ItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class ItemCreate(ItemBase):
    """Request body for creating an item."""


class ItemUpdate(BaseModel):
    """Request body for a partial update; unset fields are left untouched."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class ItemSchema(ItemBase):
    """Item as returned to clients."""

    model_config = ConfigDict(from_attributes=True)

    id: int
