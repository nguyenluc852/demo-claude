/** Non-string configuration values. No magic numbers elsewhere. */
export const PAGINATION = {
  defaultPage: 1,
  defaultSize: 20,
} as const

export const HEALTH_STATUS_OK = 'ok' as const

/** Redux slice names, also used as action-type prefixes. */
export const SLICE = {
  health: 'health',
  items: 'items',
} as const

/** Async thunk request states. */
export const STATUS = {
  idle: 'idle',
  loading: 'loading',
  succeeded: 'succeeded',
  failed: 'failed',
} as const
