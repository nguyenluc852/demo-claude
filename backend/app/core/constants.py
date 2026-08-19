"""Every literal value used for routing, paging, storage, and headers lives here.

Nothing else in the codebase may contain a bare string or magic number for these.
`src/constants/api.ts` on the frontend mirrors the route table — change both together.
"""

from typing import Final


class ApiPrefix:
    ROOT: Final = "/api"
    V1: Final = "/v1"


class Route:
    HEALTH: Final = "/health"
    ITEMS: Final = "/items"
    ITEM_DETAIL: Final = "/items/{item_id}"

    # Auth
    AUTH_REGISTER: Final = "/auth/register"
    AUTH_LOGIN: Final = "/auth/login"
    AUTH_ME: Final = "/auth/me"
    AUTH_VERIFY: Final = "/auth/verify"
    AUTH_RESEND_VERIFICATION: Final = "/auth/resend-verification"

    # Users
    USERS: Final = "/users"
    USER_DETAIL: Final = "/users/{user_id}"

    # Rooms
    ROOMS: Final = "/rooms"
    ROOMS_GRID: Final = "/rooms/grid"
    ROOM_DETAIL: Final = "/rooms/{room_id}"

    # Contracts
    CONTRACTS: Final = "/contracts"
    CONTRACT_DETAIL: Final = "/contracts/{contract_id}"

    # Meter readings
    METERS: Final = "/meters"
    METER_DETAIL: Final = "/meters/{room_id}"

    # Invoices
    INVOICES: Final = "/invoices"
    INVOICE_DETAIL: Final = "/invoices/{invoice_id}"
    INVOICE_SEND: Final = "/invoices/{invoice_id}/send"
    INVOICE_PAYMENT: Final = "/invoices/{invoice_id}/payment"
    INVOICE_PDF: Final = "/invoices/{invoice_id}/pdf"
    INVOICE_DISPATCH: Final = "/invoices/dispatch"

    # Master data — service prices
    SERVICES: Final = "/services"
    SERVICE_DETAIL: Final = "/services/{service_id}"

    # Leads (homepage contact form)
    LEADS: Final = "/leads"
    LEAD_DETAIL: Final = "/leads/{lead_id}"

    # Dashboard
    DASHBOARD_SUMMARY: Final = "/dashboard/summary"
    DASHBOARD_REVENUE: Final = "/dashboard/revenue"

    # Public (unauthenticated) surface for the homepage
    PUBLIC_ROOMS: Final = "/public/rooms"
    PUBLIC_LEADS: Final = "/public/leads"

    # Tenant self-service portal
    TENANT_ME: Final = "/tenant/me"
    TENANT_INVOICES: Final = "/tenant/invoices"


class Tag:
    HEALTH: Final = "health"
    ITEMS: Final = "items"
    AUTH: Final = "auth"
    USERS: Final = "users"
    ROOMS: Final = "rooms"
    CONTRACTS: Final = "contracts"
    METERS: Final = "meters"
    INVOICES: Final = "invoices"
    SERVICES: Final = "services"
    LEADS: Final = "leads"
    DASHBOARD: Final = "dashboard"
    PUBLIC: Final = "public"
    TENANT: Final = "tenant"


class Collection:
    """MongoDB collection names."""

    USERS: Final = "users"
    ROOMS: Final = "rooms"
    CONTRACTS: Final = "contracts"
    METER_READINGS: Final = "meter_readings"
    INVOICES: Final = "invoices"
    SERVICES: Final = "services"
    LEADS: Final = "leads"


class Field:
    """Document field names used in queries, sorts, and index definitions."""

    ID: Final = "_id"
    EMAIL: Final = "email"
    USERNAME: Final = "username"
    PASSWORD_HASH: Final = "password_hash"
    ROLE: Final = "role"
    ROOM_ID: Final = "room_id"
    ROOM_NUMBER: Final = "room_number"
    CONTRACT_ID: Final = "contract_id"
    STATUS: Final = "status"
    PERIOD: Final = "period"
    CODE: Final = "code"
    CREATED_AT: Final = "created_at"
    FLOOR: Final = "floor"
    VERIFICATION_TOKEN: Final = "verification_token"
    TOTAL: Final = "total"
    PAID_AMOUNT: Final = "paid_amount"


class UserRole:
    ADMIN: Final = "admin"
    MANAGER: Final = "manager"
    TENANT: Final = "tenant"
    ALL: Final = (ADMIN, MANAGER, TENANT)
    STAFF: Final = (ADMIN, MANAGER)


class RoomStatus:
    AVAILABLE: Final = "available"
    OCCUPIED: Final = "occupied"
    MAINTENANCE: Final = "maintenance"
    OVERDUE: Final = "overdue"
    ALL: Final = (AVAILABLE, OCCUPIED, MAINTENANCE, OVERDUE)


class RoomType:
    STUDIO: Final = "studio"
    ONE_BEDROOM: Final = "1pn"
    TWO_BEDROOM: Final = "2pn"
    ALL: Final = (STUDIO, ONE_BEDROOM, TWO_BEDROOM)


class ContractStatus:
    ACTIVE: Final = "active"
    EXPIRING: Final = "expiring"
    TERMINATED: Final = "terminated"
    OVERDUE: Final = "overdue"
    ALL: Final = (ACTIVE, EXPIRING, TERMINATED, OVERDUE)


class PaymentCycle:
    MONTHLY: Final = "monthly"
    QUARTERLY: Final = "quarterly"
    ALL: Final = (MONTHLY, QUARTERLY)


class InvoiceStatus:
    DRAFT: Final = "draft"
    SENT: Final = "sent"
    UNPAID: Final = "unpaid"
    PARTIALLY_PAID: Final = "partially_paid"
    PAID: Final = "paid"
    ALL: Final = (DRAFT, SENT, UNPAID, PARTIALLY_PAID, PAID)
    # Statuses whose payment state a resend must not overwrite.
    PAYMENT_LOCKED: Final = (PARTIALLY_PAID, PAID, UNPAID)


class LeadStatus:
    NEW: Final = "new"
    CONTACTED: Final = "contacted"
    CLOSED: Final = "closed"
    ALL: Final = (NEW, CONTACTED, CLOSED)


class ServiceCategory:
    METERED: Final = "metered"
    FIXED: Final = "fixed"
    ALL: Final = (METERED, FIXED)


class ServiceCode:
    """Reserved codes the invoice formula reads directly."""

    ELECTRICITY: Final = "electricity"
    WATER: Final = "water"


class ServiceUnit:
    PER_KWH: Final = "kwh"
    PER_CUBIC_METER: Final = "m3"
    PER_ROOM: Final = "room"
    PER_PERSON: Final = "person"
    PER_MONTH: Final = "month"
    ALL: Final = (PER_KWH, PER_CUBIC_METER, PER_ROOM, PER_PERSON, PER_MONTH)


class MeterFilter:
    """Tabs on the meter-reading screen."""

    ALL: Final = "all"
    MISSING_ELECTRIC: Final = "missing_electric"
    MISSING_WATER: Final = "missing_water"
    COMPLETE: Final = "complete"
    OPTIONS: Final = (ALL, MISSING_ELECTRIC, MISSING_WATER, COMPLETE)


class Pagination:
    DEFAULT_PAGE: Final = 1
    DEFAULT_SIZE: Final = 20
    MIN_SIZE: Final = 1
    MAX_SIZE: Final = 100
    # The meter grid and room grid load a whole property at once.
    GRID_SIZE: Final = 200


class Limits:
    NAME_MIN: Final = 1
    NAME_MAX: Final = 120
    TEXT_MAX: Final = 2000
    PHONE_MAX: Final = 20
    ID_CARD_MAX: Final = 20
    PASSWORD_MIN: Final = 6
    PASSWORD_MAX: Final = 128
    USERNAME_MIN: Final = 3
    USERNAME_MAX: Final = 50
    ROOM_NUMBER_MAX: Final = 20
    IMAGE_URL_MAX: Final = 500
    MAX_IMAGES: Final = 20
    MAX_AMENITIES: Final = 30
    MONEY_MAX: Final = 1_000_000_000
    METER_MAX: Final = 10_000_000
    AREA_MAX: Final = 1000
    FLOOR_MIN: Final = 0
    FLOOR_MAX: Final = 100


class Business:
    """Domain rules with a numeric threshold."""

    EXPIRING_WINDOW_DAYS: Final = 30
    PAYMENT_DUE_DAYS: Final = 10
    REVENUE_MONTHS: Final = 12
    QUARTER_MONTHS: Final = 3
    MONTHS_IN_YEAR: Final = 12
    # VND has no minor unit — every money value is rounded to a whole dong.
    MONEY_ROUNDING: Final = 0
    VERIFICATION_TOKEN_BYTES: Final = 32
    PERIOD_FORMAT: Final = "%Y-%m"


class Resend:
    """The mail provider's HTTP API.

    Mail leaves over HTTPS rather than SMTP because the hosting plan blocks
    outbound 25/465/587 at the network layer — a TLS setting cannot get around
    that, but port 443 is never blocked.
    """

    API_URL: Final = "https://api.resend.com/emails"
    TIMEOUT_SECONDS: Final = 15.0
    # Payload keys the API defines; structural, like the Mongo field names.
    FIELD_FROM: Final = "from"
    FIELD_TO: Final = "to"
    FIELD_SUBJECT: Final = "subject"
    FIELD_HTML: Final = "html"


class Header:
    REQUEST_ID: Final = "X-Request-ID"
    AUTHORIZATION: Final = "Authorization"
    CRON_SECRET: Final = "X-Cron-Secret"
    CONTENT_DISPOSITION: Final = "Content-Disposition"
    ATTACHMENT_TEMPLATE: Final = 'attachment; filename="{name}"' 


class AuthScheme:
    BEARER: Final = "Bearer"
    JWT_ALGORITHM: Final = "HS256"
    SUBJECT_CLAIM: Final = "sub"
    ROLE_CLAIM: Final = "role"
    EXPIRY_CLAIM: Final = "exp"


class AppMeta:
    VERSION: Final = "0.1.0"
    DOCS_URL: Final = "/docs"
    OPENAPI_URL: Final = "/openapi.json"


class MediaType:
    PDF: Final = "application/pdf"
    HTML: Final = "text/html"


class QueryParam:
    STATUS: Final = "status"
    PERIOD: Final = "period"
    SEARCH: Final = "search"
    FILTER: Final = "filter"
    MONTHS: Final = "months"
    TOKEN: Final = "token"
    ROOM_ID: Final = "room_id"
