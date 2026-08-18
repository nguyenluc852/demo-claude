# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Skills

Two skills in `.claude/skills/` carry the detailed conventions. Load the relevant one
before writing code:

- **`backend-endpoint`** — any FastAPI route, schema, service, or API error.
- **`frontend-feature`** — any React component, page, Redux slice, or UI text.

## Architecture

Two apps in one repo:

- `backend/` — FastAPI, Python 3.11, uvicorn on **:8000**
- `frontend/` — React 19 + TypeScript, Vite 8 dev server on **:5173**

**They are joined by a proxy, not by CORS.** `frontend/vite.config.ts` proxies `/api/*`
to the backend (target overridable via `VITE_PROXY_TARGET`, which Docker sets to the
`backend` service name); in production `frontend/nginx.conf` does the same job. The
browser therefore always sees one origin. The CORS middleware in `app/main.py` is only
for deployments where that stops being true.

Consequence: **every backend route must sit under `/api/v1`**, or the proxy will not
forward it. `app/api/v1/router.py` aggregates the feature routers and `main.py` mounts
it under the `/api` prefix — that is the only place mounting happens.

### The shared response envelope

Every endpoint returns one of three shapes, defined in `backend/app/common/schemas.py`
and mirrored in `frontend/src/types/api.ts`:

- one resource → `{"data": {...}}`
- a list → `{"data": [...], "meta": {"page", "size", "total"}}`
- any error → `{"error": {"code", "message"}}`

Services raise `AppError` subclasses (`NotFoundError`, `ConflictError`) from
`app/common/exceptions.py`; handlers in `main.py` convert them to the error envelope.
**Never raise `HTTPException` directly** — it bypasses the envelope and breaks the
frontend's `ApiError` parsing.

### Backend layers

`api/v1/` routes (thin) → `services/` business logic → `schemas/` Pydantic models.
Cross-cutting pieces live in `common/` (envelopes, exceptions, pagination dependency)
and `core/` (settings, constants, messages).

### Frontend layers

Atomic design: `components/atoms` → `molecules` → `organisms` → `templates` → `pages`.
**Only organisms may touch the Redux store**; everything below receives props. State is
Redux Toolkit slices in `src/store/slices/`, reached through the typed hooks in
`src/store/hooks.ts`. All HTTP goes through `src/api/client.ts`, never bare `fetch`.

## No hardcoded strings — either side

This is the project's defining constraint.

| Side | File | Holds |
|---|---|---|
| BE | `app/core/constants.py` | Route paths, tags, prefixes, pagination limits |
| BE | `app/core/messages.py` | Error codes and every message the API returns |
| FE | `src/constants/strings.ts` | Every piece of user-visible text |
| FE | `src/constants/api.ts` | Endpoint paths, HTTP methods, headers, error codes |
| FE | `src/constants/config.ts` | Slice names, request statuses, magic numbers |

A quoted literal in a router, service, or component is a defect. Tests obey the same
rule — assert against the constant, not the text. CSS class names and `data-*` values
are the one exception: they are structure, not content.

`app/core/constants.py` and `src/constants/api.ts` describe the same routes. Changing
one means changing the other.

## Commands

`make check` runs lint + typecheck + tests across both sides — run it before calling
work done. Also: `make dev-api`, `make dev-web`, `make test`, `make lint`,
`make typecheck`, `make install`.

Both dev servers must run to exercise the app; Vite alone gives the "API unreachable"
banner.

### Backend (from `backend/`)

The venv is **not** auto-activated — call binaries by path or `pytest` will use the
wrong interpreter.

```bash
.venv/bin/pytest -q                                  # all tests
.venv/bin/pytest tests/test_items.py::test_update_then_delete   # one test
.venv/bin/ruff check . --fix
.venv/bin/mypy app tests                             # strict mode
```

### Frontend (from `frontend/`)

```bash
npm test                            # all tests, once
npm test -- itemsSlice              # one file
npm test -- -t "renders a row"      # one test by name
npm run test:watch
npm run typecheck
npm run lint                        # oxlint
```

### Docker

`make docker-up` builds and runs the dev stack (both services hot-reload from mounted
source; frontend waits on the backend healthcheck). `make docker-prod` runs the
production stack: backend as an unprivileged user, frontend built to static assets and
served by nginx on :80, which also proxies `/api` to the backend.

Both Dockerfiles are multi-stage with `dev` and `prod` targets; compose picks the
target, so never add a third Dockerfile.

## Conventions

**Python is strict-typed.** Annotate every parameter and return, including `-> None`.
Use 3.11 syntax (`list[str]`, `X | None`).

**Request/response bodies are Pydantic models** wired through `response_model=`. Field
limits belong in `Field(...)` so validation stays declarative. List endpoints take
`PaginationDep` — unbounded list responses are not allowed.

**TypeScript has `erasableSyntaxOnly` enabled.** Constructor parameter properties,
`enum`, and `namespace` are compile errors. Use an `as const` object plus a derived
union instead of an enum.

Prefer discriminated unions over parallel booleans for UI state. Prefix fire-and-forget
thunk dispatches with `void`.

Frontend tests colocate with source (`*.test.ts[x]`); backend tests live in
`backend/tests/` and use the `client` fixture from `conftest.py`, which resets state
between cases.
