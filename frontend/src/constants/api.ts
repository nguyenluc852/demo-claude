/** API paths. Mirrors backend app/core/constants.py — keep the two in step. */
export const API_PREFIX = '/api/v1' as const

export const API_ROUTES = {
  health: '/health',
  authRegister: '/auth/register',
  authLogin: '/auth/login',
  authMe: '/auth/me',
  authVerify: '/auth/verify',
  authResendVerification: '/auth/resend-verification',

  users: '/users',
  userDetail: (id: string) => `/users/${id}`,

  rooms: '/rooms',
  roomsGrid: '/rooms/grid',
  roomDetail: (id: string) => `/rooms/${id}`,

  contracts: '/contracts',
  contractDetail: (id: string) => `/contracts/${id}`,

  meters: '/meters',
  meterDetail: (roomId: string) => `/meters/${roomId}`,

  invoices: '/invoices',
  invoiceDetail: (id: string) => `/invoices/${id}`,
  invoiceSend: (id: string) => `/invoices/${id}/send`,
  invoicePayment: (id: string) => `/invoices/${id}/payment`,
  invoicePdf: (id: string) => `/invoices/${id}/pdf`,

  services: '/services',
  serviceDetail: (id: string) => `/services/${id}`,

  leads: '/leads',
  leadDetail: (id: string) => `/leads/${id}`,

  dashboardSummary: '/dashboard/summary',
  dashboardRevenue: '/dashboard/revenue',

  publicRooms: '/public/rooms',
  publicLeads: '/public/leads',

  tenantMe: '/tenant/me',
  tenantInvoices: '/tenant/invoices',
} as const

export const HTTP_METHOD = {
  get: 'GET',
  post: 'POST',
  patch: 'PATCH',
  put: 'PUT',
  delete: 'DELETE',
} as const

export const HTTP_HEADER = {
  contentType: 'Content-Type',
  authorization: 'Authorization',
} as const

export const CONTENT_TYPE_JSON = 'application/json' as const
export const AUTH_SCHEME = 'Bearer' as const

export const QUERY_PARAM = {
  status: 'status',
  period: 'period',
  search: 'search',
  filter: 'filter',
  months: 'months',
  token: 'token',
  page: 'page',
  size: 'size',
} as const

export const ERROR_CODE = {
  notFound: 'NOT_FOUND',
  validationError: 'VALIDATION_ERROR',
  conflict: 'CONFLICT',
  internalError: 'INTERNAL_ERROR',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  badRequest: 'BAD_REQUEST',
} as const
