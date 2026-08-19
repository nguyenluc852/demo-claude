# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A boarding-house (nhà trọ) management system, built to the SRS in
`Yeu_Cau_Phan_Mem_Quan_Ly_Phong_Tro_V2.md`. Two audiences share one deployment: a
public homepage that advertises rooms and collects enquiries, and a CMS where the
owner runs rooms, leases, monthly meter readings, and invoicing. Tenants get a
read-only portal of their own.

**The UI is in Vietnamese.** Every user-visible string lives in
`frontend/src/constants/strings.ts`, and API messages in `app/core/messages.py`.

## Skills

Three skills in `.claude/skills/` carry the detailed conventions. Load the relevant
one before writing code:

- **`backend-endpoint`** — any FastAPI route, schema, service, or API error.
- **`frontend-feature`** — any React component, page, Redux slice, or UI text.
- **`frontend-design`** — any visual work: palette, type, layout, new screens.

## Architecture

Two apps and a database:

- `backend/` — FastAPI, Python 3.11, uvicorn on **:8000**
- `frontend/` — React 19 + TypeScript, Vite 8 dev server on **:5173**
- MongoDB 7, run from `docker-compose.yml` on **:27017**

**The apps are joined by a proxy, not by CORS.** `frontend/vite.config.ts` proxies
`/api/*` to the backend (target overridable via `VITE_PROXY_TARGET`, which Docker sets
to the `backend` service name); in production `frontend/nginx.conf` does the same job.
The browser therefore always sees one origin. The CORS middleware in `app/main.py` is
only for deployments where that stops being true.

Consequence: **every backend route must sit under `/api/v1`**, or the proxy will not
forward it. `app/api/v1/router.py` aggregates the feature routers and `main.py` mounts
it under the `/api` prefix — that is the only place mounting happens.

### The shared response envelope

Every endpoint returns one of three shapes, defined in `backend/app/common/schemas.py`
and mirrored in `frontend/src/types/api.ts`:

- one resource → `{"data": {...}}`
- a list → `{"data": [...], "meta": {"page", "size", "total"}}`
- any error → `{"error": {"code", "message"}}`

Services raise `AppError` subclasses (`NotFoundError`, `ConflictError`,
`BadRequestError`, `UnauthorizedError`, `ForbiddenError`) from
`app/common/exceptions.py`; handlers in `main.py` convert them to the error envelope.
**Never raise `HTTPException` directly** — it bypasses the envelope and breaks the
frontend's `ApiError` parsing.

The invoice PDF route is the one deliberate exception: it returns bytes, not JSON.

### Backend layers

`api/v1/` routes (thin) → `services/` business logic → `schemas/` Pydantic models.
Cross-cutting pieces live in `common/` and `core/` (settings, constants, messages).

`common/` is worth knowing before writing a service:

| Module | Use it for |
|---|---|
| `documents.py` | `serialize()` (`_id` → `id`) and `to_object_id()` (bad id → 404) |
| `money.py` | `to_vnd()` — round every amount at the point it is produced |
| `periods.py` | `YYYY-MM` billing periods: `current_period`, `shift_period`, `recent_periods` |
| `security.py` | password hashing, JWT encode/decode |
| `validators.py` | `one_of()` — keeps enum-ish fields anchored to `constants.py` |

### MongoDB

`app/db/mongo.py` owns a single Motor client. The FastAPI lifespan calls `connect()`
(which also creates every index the queries rely on) and `close()`. Services reach
collections through `get_collection(Collection.X)` at call time — **never cache a
collection handle at import time**, or it goes stale across a reconnect.

Collection names live in `Collection`, document field names in `Field`. Queries use
those constants, not string literals.

### Frontend layers

Atomic design: `components/atoms` → `molecules` → `organisms` → `templates` → `pages`.
**Only organisms may touch the Redux store**; everything below receives props. State is
Redux Toolkit slices in `src/store/slices/`, reached through the typed hooks in
`src/store/hooks.ts`. All HTTP goes through `src/api/client.ts`, never bare `fetch`.

Routing is react-router in `App.tsx`. Paths live in `ROUTE_PATH` (`constants/config.ts`).
`RequireRole` guards a route: it trades a stored token for its user before deciding, so
a refresh inside the CMS does not bounce the operator to the login screen.

`src/utils/labels.ts` maps backend enum values to their Vietnamese label and their
badge colour. Read a status label from there so it is spelled the same everywhere.

## Domain rules that are not obvious from the code

These are the behaviours the tests pin down; changing them changes the product.

- **Signing a contract does three things**: creates the lease, flips the room to
  `occupied`, and provisions the tenant's login (username = email, default password =
  phone) with a verification email. Terminating or deleting a contract hands the room
  back to `available`.
- **A tenant cannot sign in until they click the verification link.** Staff accounts
  are trusted at creation and skip it. Editing a contract's email resets verification
  and sends a fresh link.
- **Saving both meters for a period issues that period's invoice.** One meter alone
  does not. Re-saving recalculates the same period rather than creating a second
  invoice. A reading below the previous one is rejected.
- **Invoice lines snapshot the unit price they were billed at**, so editing the price
  list in Master Settings never rewrites an invoice that was already issued.
- **A resend never overwrites payment state.** Sending marks a draft `unpaid`; a
  resend of a partially-paid or paid invoice leaves that status alone.
- Contract status is derived from the clock on read (`derive_status`), not stored, so
  "expiring within 30 days" is always current.

## Auth and roles

Three roles in `UserRole`: `admin`, `manager`, `tenant`. Route dependencies in
`common/deps.py` express who may call what:

| Dependency | Allows |
|---|---|
| `CurrentUserDep` | any signed-in user |
| `StaffDep` | admin + manager — the whole CMS sits behind this |
| `AdminDep` | admin only — account administration |
| `TenantDep` | tenant only — the self-service portal |

`current_user` re-reads the user row every request, so a role change or a deletion
takes effect immediately rather than at the token's expiry.

## No hardcoded strings — either side

This is the project's defining constraint.

| Side | File | Holds |
|---|---|---|
| BE | `app/core/constants.py` | Routes, tags, collections, field names, enums, limits |
| BE | `app/core/messages.py` | Error codes and every message the API returns |
| FE | `src/constants/strings.ts` | Every piece of user-visible text |
| FE | `src/constants/api.ts` | Endpoint paths, HTTP methods, headers, error codes |
| FE | `src/constants/config.ts` | Enums, slice names, request statuses, route paths |

A quoted literal in a router, service, or component is a defect. Tests obey the same
rule — assert against the constant, not the text. CSS class names and `data-*` values
are the one exception: they are structure, not content.

`app/core/constants.py` and `src/constants/api.ts` describe the same routes, and the
enum blocks in `constants.py` and `config.ts` describe the same values. Changing one
means changing the other.

Pydantic's `Literal` would force those enum values to be duplicated into the schema
layer, so schemas validate with `one_of(value, SomeEnum.ALL)` instead.

## Design system

`frontend/src/index.css` holds the whole system; there is no CSS-in-JS and no utility
framework. Read the comment at the top of that file before changing visual style.

The direction is grounded in the two artifacts this business runs on — the electricity
meter and the ruled ledger the owner writes readings into. Hence ledger paper rather
than white, ballpoint ink rather than black, a hairline rule as the only divider, and
`--font-mono` on **every number** (readings, room numbers, money, periods).

Saturated colour is spent in two places only: `--seal-600` for primary actions and
errors, and the four room-status colours the SRS fixes (green vacant, red occupied,
amber maintenance, violet in arrears). Adding a third accent is a regression.

Type roles: `--font-display` (Bricolage Grotesque, headings), `--font-body`
(Be Vietnam Pro — chosen because it sets Vietnamese diacritics correctly), and
`--font-mono` (IBM Plex Mono, data).

## Double-click protection

Every control that fires a request passes its in-flight state to `<Button loading>`,
which disables the button and swaps in a loading label. Slices track that state at the
right granularity: a single `submitting` flag where a modal blocks as a whole, and a
list of ids (`pendingIds`, `savingRoomIds`) where individual rows submit independently.
Modals additionally take `busy`, which drops an overlay over the dialog.

## Commands

`make check` runs lint + typecheck + tests across both sides — run it before calling
work done. Also: `make dev-api`, `make dev-web`, `make test`, `make lint`,
`make typecheck`, `make install`.

Mongo must be up before the API will start: `docker compose up -d mongo`.
Both dev servers must run to exercise the app; Vite alone gives the "API unreachable"
banner.

### Backend (from `backend/`)

The venv is **not** auto-activated — call binaries by path or `pytest` will use the
wrong interpreter.

```bash
.venv/bin/pytest -q                                          # all tests
.venv/bin/pytest tests/test_meters_invoices.py -k resend     # one case
.venv/bin/ruff check . --fix
.venv/bin/mypy app tests scripts                             # strict mode
.venv/bin/python -m scripts.seed                             # demo property
```

`scripts/seed.py` is idempotent: it creates an admin, eight rooms, five leases, three
billed periods, and a couple of enquiries. Re-running tops the data up.

### Frontend (from `frontend/`)

```bash
npm test                            # all tests, once
npm test -- metersSlice             # one file
npm test -- -t "locks the inputs"   # one test by name
npm run test:watch
npm run typecheck
npm run lint                        # oxlint
```

### Docker

`make docker-up` builds and runs the dev stack — mongo, backend, and frontend, each
waiting on the previous one's healthcheck; both apps hot-reload from mounted source.
`make docker-prod` runs the production stack: backend as an unprivileged user,
frontend built to static assets and served by nginx on :80, which also proxies `/api`.

Both Dockerfiles are multi-stage with `dev` and `prod` targets; compose picks the
target, so never add a third Dockerfile.

## Conventions

**Python is strict-typed.** Annotate every parameter and return, including `-> None`.
Use 3.11 syntax (`list[str]`, `X | None`).

Naming a service method `list` shadows the builtin for every annotation written after
it inside that class body. `services/room.py` works around it with module-level type
aliases; do the same rather than renaming the method.

**Request/response bodies are Pydantic models** wired through `response_model=`. Field
limits belong in `Field(...)` so validation stays declarative. List endpoints take
`PaginationDep` — unbounded list responses are not allowed. The room and meter grids
are bounded by `Pagination.GRID_SIZE` instead and still return the page envelope.

**TypeScript has `erasableSyntaxOnly` enabled.** Constructor parameter properties,
`enum`, and `namespace` are compile errors. Use an `as const` object plus a derived
union instead of an enum.

Prefer discriminated unions over parallel booleans for UI state. Prefix fire-and-forget
thunk dispatches with `void`.

## Testing

Frontend tests colocate with source (`*.test.ts[x]`) and use `renderWithStore` from
`src/test/utils.tsx`, which builds a fresh store per test. Stub the network with
`vi.stubGlobal('fetch', ...)` returning the real envelope shape.

Backend tests live in `backend/tests/`. `conftest.py` **repoints the suite at its own
database** (`<db>_test`) before importing the app, then wipes every collection it
touches between cases — the suite must never be able to delete the data a running dev
server is serving. Build fixtures with the helpers in `tests/factories.py`.

`app/api/v1/{health,items}.py` are leftover scaffold. `items` is an in-memory demo with
no frontend left; do not extend it, and do not model new work on it.

## Email and scheduling

`services/email.py` sends through `aiosmtplib`. **With `SMTP_HOST` unset it logs the
message instead of sending**, so no mail server is needed to exercise the flows that
trigger email. `services/scheduler.py` runs one APScheduler cron job that dispatches
draft invoices monthly; the lifespan starts and stops it so a reload cannot leave two
schedulers running against the same database.
