import {
  API_PREFIX,
  CONTENT_TYPE_JSON,
  HTTP_HEADER,
  HTTP_METHOD,
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: { [HTTP_HEADER.contentType]: CONTENT_TYPE_JSON, ...init?.headers },
    })
  } catch {
    throw new ApiError(STRINGS.errors.network, 0, '')
  }

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

  post: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: HTTP_METHOD.post, body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: HTTP_METHOD.patch, body: JSON.stringify(body) }),

  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: HTTP_METHOD.delete }),
}
