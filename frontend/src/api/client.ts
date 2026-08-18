import {
  API_PREFIX,
  AUTH_SCHEME,
  CONTENT_TYPE_JSON,
  HTTP_HEADER,
  HTTP_METHOD,
  STORAGE_KEY,
  STRINGS,
} from '../constants'
import type { ErrorResponse } from '../types/api'

/** Empty in dev: Vite proxies the API prefix to the FastAPI server. */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * The bearer token lives here rather than in the store so `request` can read it
 * without importing the store and creating a cycle. Storage keeps a reload
 * signed in; the auth slice is what writes to both.
 */
let authToken: string | null = null

/**
 * Storage is read at module load, which is also the point where it may not
 * exist yet (a test environment, or a browser with storage blocked). Treating
 * that as "no stored session" keeps the app usable instead of failing to boot.
 */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null) {
  authToken = token
  const store = storage()
  if (!store) {
    return
  }
  if (token) {
    store.setItem(STORAGE_KEY.token, token)
  } else {
    store.removeItem(STORAGE_KEY.token)
  }
}

export function loadStoredToken(): string | null {
  authToken = storage()?.getItem(STORAGE_KEY.token) ?? null
  return authToken
}

function authHeaders(): Record<string, string> {
  return authToken ? { [HTTP_HEADER.authorization]: `${AUTH_SCHEME} ${authToken}` } : {}
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: {
        [HTTP_HEADER.contentType]: CONTENT_TYPE_JSON,
        ...authHeaders(),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(STRINGS.errors.network, 0, '')
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init)

  if (response.status === 204) {
    return undefined as T
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = (body as ErrorResponse | null)?.error
    throw new ApiError(
      detail?.message ?? STRINGS.errors.generic,
      response.status,
      detail?.code ?? '',
    )
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: HTTP_METHOD.get }),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, {
      method: HTTP_METHOD.post,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: HTTP_METHOD.patch, body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: HTTP_METHOD.put, body: JSON.stringify(body) }),

  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: HTTP_METHOD.delete }),

  /** Binary responses (the invoice PDF) bypass the JSON envelope entirely. */
  blob: async (path: string): Promise<Blob> => {
    const response = await send(path, { method: HTTP_METHOD.get })
    if (!response.ok) {
      throw new ApiError(STRINGS.errors.generic, response.status, '')
    }
    return response.blob()
  },
}
