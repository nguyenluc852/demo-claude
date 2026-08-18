"""Every literal value used for routing, paging, and headers lives here.

Nothing else in the codebase may contain a bare string or magic number for these.
"""

from typing import Final


class ApiPrefix:
    ROOT: Final = "/api"
    V1: Final = "/v1"


class Route:
    HEALTH: Final = "/health"
    ITEMS: Final = "/items"
    ITEM_DETAIL: Final = "/items/{item_id}"


class Tag:
    HEALTH: Final = "health"
    ITEMS: Final = "items"


class Pagination:
    DEFAULT_PAGE: Final = 1
    DEFAULT_SIZE: Final = 20
    MIN_SIZE: Final = 1
    MAX_SIZE: Final = 100


class Header:
    REQUEST_ID: Final = "X-Request-ID"


class AppMeta:
    VERSION: Final = "0.1.0"
    DOCS_URL: Final = "/docs"
    OPENAPI_URL: Final = "/openapi.json"
