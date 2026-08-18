"""Every human-readable string returned by the API.

Routes and services must reference these constants, never inline text.
"""

from typing import Final


class ErrorCode:
    NOT_FOUND: Final = "NOT_FOUND"
    VALIDATION_ERROR: Final = "VALIDATION_ERROR"
    CONFLICT: Final = "CONFLICT"
    INTERNAL_ERROR: Final = "INTERNAL_ERROR"


class ErrorMessage:
    ITEM_NOT_FOUND: Final = "Item not found"
    ITEM_NAME_TAKEN: Final = "An item with this name already exists"
    VALIDATION_FAILED: Final = "Request validation failed"
    INTERNAL_ERROR: Final = "An unexpected error occurred"


class SuccessMessage:
    ITEM_CREATED: Final = "Item created"
    ITEM_DELETED: Final = "Item deleted"


class HealthStatus:
    OK: Final = "ok"
