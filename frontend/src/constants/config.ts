/** Non-string configuration values. No magic numbers elsewhere. */
export const PAGINATION = {
  defaultPage: 1,
  defaultSize: 20,
  gridSize: 200,
} as const

export const HEALTH_STATUS_OK = 'ok' as const

/** Redux slice names, also used as action-type prefixes. */
export const SLICE = {
  health: 'health',
  auth: 'auth',
  rooms: 'rooms',
  contracts: 'contracts',
  meters: 'meters',
  invoices: 'invoices',
  services: 'services',
  users: 'users',
  leads: 'leads',
  dashboard: 'dashboard',
  publicSite: 'publicSite',
  tenant: 'tenant',
} as const

/** Async thunk request states. */
export const STATUS = {
  idle: 'idle',
  loading: 'loading',
  succeeded: 'succeeded',
  failed: 'failed',
} as const

/** Domain enums. Mirrors the same names in backend app/core/constants.py. */
export const USER_ROLE = {
  admin: 'admin',
  manager: 'manager',
  tenant: 'tenant',
} as const

export const ROOM_STATUS = {
  available: 'available',
  occupied: 'occupied',
  maintenance: 'maintenance',
  overdue: 'overdue',
} as const

export const ROOM_TYPE = {
  studio: 'studio',
  oneBedroom: '1pn',
  twoBedroom: '2pn',
} as const

export const CONTRACT_STATUS = {
  active: 'active',
  expiring: 'expiring',
  terminated: 'terminated',
  overdue: 'overdue',
} as const

export const PAYMENT_CYCLE = {
  monthly: 'monthly',
  quarterly: 'quarterly',
} as const

export const INVOICE_STATUS = {
  draft: 'draft',
  sent: 'sent',
  unpaid: 'unpaid',
  partiallyPaid: 'partially_paid',
  paid: 'paid',
} as const

export const LEAD_STATUS = {
  new: 'new',
  contacted: 'contacted',
  closed: 'closed',
} as const

export const SERVICE_CATEGORY = {
  metered: 'metered',
  fixed: 'fixed',
} as const

export const SERVICE_UNIT = {
  perKwh: 'kwh',
  perCubicMeter: 'm3',
  perRoom: 'room',
  perPerson: 'person',
  perMonth: 'month',
} as const

export const METER_FILTER = {
  all: 'all',
  missingElectric: 'missing_electric',
  missingWater: 'missing_water',
  complete: 'complete',
} as const

/** Revenue chart windows offered by the dashboard filter. */
export const REVENUE_RANGE = {
  month: 1,
  quarter: 3,
  year: 12,
} as const

/** Where the JWT is kept so a reload does not sign the user out. */
export const STORAGE_KEY = {
  token: 'motel.token',
} as const

export const ROUTE_PATH = {
  home: '/',
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  admin: '/admin',
  adminRooms: '/admin/rooms',
  adminContracts: '/admin/contracts',
  adminMeters: '/admin/meters',
  adminInvoices: '/admin/invoices',
  adminServices: '/admin/services',
  adminUsers: '/admin/users',
  adminLeads: '/admin/leads',
  tenant: '/tenant',
} as const

/** Locale used for every currency and number format in the UI. */
export const LOCALE = 'vi-VN' as const
export const CURRENCY = 'VND' as const

export const CONTACT_FORM_ANCHOR = 'contact-form' as const
export const ROOMS_ANCHOR = 'rooms' as const
export const AMENITIES_ANCHOR = 'amenities' as const
export const PROCESS_ANCHOR = 'process' as const
export const FAQ_ANCHOR = 'faq' as const

/**
 * Photography the homepage leans on. Remote like the seeded room images, so the
 * repo stays free of stock photos; the drawn icons live in src/assets instead.
 */
export const HOME_MEDIA = {
  building: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80',
} as const

/** How long the stat counters take to run up to their real value. */
export const COUNT_UP_MS = 900 as const

/** Stagger between cards in a revealing grid. */
export const STAGGER_MS = 70 as const
