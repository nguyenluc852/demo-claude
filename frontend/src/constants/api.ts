/** API paths. Mirrors backend app/core/constants.py — keep the two in step. */
export const API_PREFIX = '/api/v1' as const

export const API_ROUTES = {
  health: '/health',
  items: '/items',
  itemDetail: (id: number) => `/items/${id}`,
} as const

export const HTTP_METHOD = {
  get: 'GET',
  post: 'POST',
  patch: 'PATCH',
  delete: 'DELETE',
} as const

export const HTTP_HEADER = {
  contentType: 'Content-Type',
} as const

export const CONTENT_TYPE_JSON = 'application/json' as const

export const ERROR_CODE = {
  notFound: 'NOT_FOUND',
  validationError: 'VALIDATION_ERROR',
  conflict: 'CONFLICT',
  internalError: 'INTERNAL_ERROR',
} as const
