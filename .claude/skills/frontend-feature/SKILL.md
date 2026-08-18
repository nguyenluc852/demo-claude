---
name: frontend-feature
description: Build or change React UI in frontend/. Use whenever work involves a component, screen, page, form, Redux slice, store state, API call from the browser, or any user-facing text — including "add a screen for X", "show Y in the UI", "wire up Z", or restyling existing components.
---

# Building frontend features

The app follows atomic design with Redux Toolkit. The layers already exist — put
new code in the right one rather than starting a parallel structure.

## Atomic design layers

| Layer | Path | May it hold state? | May it touch the store? |
|---|---|---|---|
| atoms | `src/components/atoms/` | No — props only | **Never** |
| molecules | `src/components/molecules/` | No — props only | **Never** |
| organisms | `src/components/organisms/` | Yes, local UI state | **Yes** — this is the only layer that may |
| templates | `src/components/templates/` | No — layout only | **Never** |
| pages | `src/pages/` | No — composes organisms into a template | No |

Atoms are single elements (`Button`, `Input`, `Text`, `Spinner`). Molecules combine
a few atoms into one labelled unit (`FormField`, `ItemRow`). Organisms are the
connected, meaningful sections (`ItemList`, `ItemForm`, `HealthBanner`). Templates
are pure layout. Pages wire organisms into a template and nothing more.

If a component needs `useAppSelector`, it is an organism. Pushing store access down
into a molecule is the most common way this structure gets broken — pass data down
as props instead.

## The rule that matters most

**No hardcoded user-facing strings, anywhere.** Every piece of text a person can
read lives in `src/constants/strings.ts`, grouped by the screen that renders it.

```tsx
<Button>Add item</Button>              // wrong
<Button>{STRINGS.items.addAction}</Button>   // right
```

This holds for labels, placeholders, headings, empty states, loading text, error
messages, and button captions. The same rule applies to tests: assert against
`STRINGS.items.empty`, never the literal.

### What goes in which constants file

| File | Holds |
|---|---|
| `src/constants/strings.ts` | All human-readable text |
| `src/constants/api.ts` | Endpoint paths, HTTP methods, headers, backend error codes |
| `src/constants/config.ts` | Slice names, request-status values, pagination defaults, other magic numbers |

Import from the `src/constants` barrel (`import { STRINGS, SLICE } from '../../constants'`).

**Boundary:** CSS class names and `data-*` attribute values are structure, not
content, so they stay inline. Everything a user can read does not.

## Steps for a new feature

1. **Types.** Add the model to `src/types/models.ts`, matching the backend Pydantic
   schema field for field. Envelope types (`DataResponse`, `PageResponse`) already
   exist in `src/types/api.ts` — reuse them.
2. **Constants.** Add the path to `API_ROUTES` in `src/constants/api.ts`, all text to
   `STRINGS`, and the slice name to `SLICE` in `config.ts`.
3. **API call.** Add to `src/api/endpoints.ts` using `apiClient`. Never call `fetch`
   directly — `apiClient` owns the prefix, JSON headers, 204 handling, and the
   `ApiError` translation of the backend error envelope.
4. **Slice.** Create `src/store/slices/<feature>Slice.ts` with `createSlice` and
   `createAsyncThunk`. Name thunks `` `${SLICE.x}/action` ``. Track a
   `RequestStatus` field and compare against `STATUS.*`, never a raw `'loading'`.
   Register the reducer in `src/store/index.ts`.
5. **Components.** Build bottom-up: reuse existing atoms before adding one. Export
   each new component from its layer's `index.ts` barrel.
6. **Page.** Compose organisms inside `PageTemplate`.
7. **Test.** Use `renderWithStore` from `src/test/utils.tsx` — it builds a fresh
   store per test. Stub network with `vi.stubGlobal('fetch', ...)` returning the
   real envelope shape (`{ data, meta }` or `{ error: { code, message } }`).

## Store access

Always the typed hooks from `src/store/hooks.ts` (`useAppDispatch`,
`useAppSelector`) — never raw `useDispatch` / `useSelector`, which lose the types.
Select with the slice constant: `useAppSelector((state) => state[SLICE.items])`.

Thunk dispatches in effects and handlers are floating promises; prefix them with
`void` so the intent is explicit.

## Verify

```bash
cd frontend
npm test && npm run typecheck && npm run lint
```

`erasableSyntaxOnly` is on: no constructor parameter properties, no `enum`, no
`namespace`. Use `as const` objects plus a derived union type instead of an enum.
