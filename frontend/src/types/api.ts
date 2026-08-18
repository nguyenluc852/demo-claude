/** Mirrors the response envelopes in backend app/common/schemas.py. */

export interface ErrorDetail {
  code: string
  message: string
}

export interface ErrorResponse {
  error: ErrorDetail
}

export interface DataResponse<T> {
  data: T
}

export interface PageMeta {
  page: number
  size: number
  total: number
}

export interface PageResponse<T> {
  data: T[]
  meta: PageMeta
}

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'
