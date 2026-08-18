---
name: backend-endpoint
description: Add or change a FastAPI endpoint in backend/. Use whenever work involves a route, router, request/response schema, service-layer logic, validation, or an API error in the Python backend — including "add an API for X", "expose X over HTTP", "the endpoint should return Y", or changing pagination or error codes.
---

# Adding a FastAPI endpoint

The backend already has a base layer. Reuse it — do not invent a second way to do
any of this.

## Where things go

| Concern | File | Rule |
|---|---|---|
| Route paths, tags, prefixes, limits | `app/core/constants.py` | Every path and number is a `Final` here |
| User-facing text, error codes | `app/core/messages.py` | Every string the API returns |
| Request/response models | `app/schemas/<feature>.py` | Pydantic only, no logic |
| Business logic | `app/services/<feature>.py` | Raises `AppError` subclasses |
| Routes | `app/api/v1/<feature>.py` | Thin: validate, delegate, wrap |
| Router registration | `app/api/v1/router.py` | The only place routers are included |
| Response envelopes, shared deps | `app/common/` | Extend, don't fork |

## The rule that matters most

**No bare string or magic number outside `core/constants.py` and `core/messages.py`.**
That includes route paths, tags, error messages, status text, and header names. A
route decorated `@router.get("/items")` is wrong; it must be
`@router.get(Route.ITEMS)`. This is what the whole layout exists to enforce — if you
find yourself typing a quoted literal in a router or service, it belongs in a
constants module first.

## Steps

1. **Constants first.** Add the path to `Route`, the tag to `Tag` (if new), and any
   limit to the relevant class in `app/core/constants.py`.
2. **Messages.** Add error text to `ErrorMessage` and, if a new failure mode exists,
   a code to `ErrorCode` in `app/core/messages.py`.
3. **Schemas.** In `app/schemas/<feature>.py`, follow the `ItemBase` / `ItemCreate` /
   `ItemUpdate` / `ItemSchema` split from `app/schemas/item.py`. Put field limits in
   `Field(...)` so validation is declarative. `ItemUpdate` fields are all optional —
   partial updates use `model_dump(exclude_unset=True)`.
4. **Service.** Business logic goes in `app/services/<feature>.py`. It raises
   `NotFoundError` / `ConflictError` from `app.common.exceptions`, never
   `HTTPException` — the handlers in `app/main.py` turn those into the shared error
   envelope automatically.
5. **Router.** In `app/api/v1/<feature>.py`, keep handlers to a few lines. Wrap the
   return value in `DataResponse[T]` for one resource or `PageResponse[T]` for a
   list. List endpoints take `PaginationDep` — unbounded lists are not allowed.
6. **Register.** Add `api_router.include_router(<feature>.router)` in
   `app/api/v1/router.py`. Nothing else needs to change; `main.py` mounts the whole
   v1 router under the `/api` prefix.
7. **Test.** Add `tests/test_<feature>.py` using the `client` fixture from
   `tests/conftest.py` (it resets state per test). Cover the success path, the
   404/409 envelope, and a 422. Import paths and codes from the constants modules —
   tests must not hardcode strings either.

## Envelope contract

Success for one resource is `{"data": {...}}`; a list is
`{"data": [...], "meta": {"page", "size", "total"}}`; any error is
`{"error": {"code", "message"}}`. Clients depend on this — a raw dict return breaks
the TypeScript types in `frontend/src/types/api.ts`.

## Keep the frontend in step

`app/core/constants.py` and `frontend/src/constants/api.ts` describe the same paths.
Changing a route or an error code means changing both, plus
`frontend/src/types/models.ts` if a schema changed.

## Verify

```bash
cd backend
.venv/bin/pytest -q && .venv/bin/ruff check . && .venv/bin/mypy app tests
```

mypy runs strict: annotate every parameter and return type, including `-> None`.
