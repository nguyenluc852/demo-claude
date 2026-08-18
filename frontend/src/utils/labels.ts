/**
 * Maps the backend's enum values onto the Vietnamese labels in STRINGS and the
 * visual bucket each one belongs to. Screens read labels from here so a status
 * is spelled the same way everywhere.
 */
import type { BadgeStatus } from '../components/atoms'
import {
  CONTRACT_STATUS,
  INVOICE_STATUS,
  LEAD_STATUS,
  PAYMENT_CYCLE,
  ROOM_STATUS,
  ROOM_TYPE,
  SERVICE_CATEGORY,
  SERVICE_UNIT,
  STRINGS,
  USER_ROLE,
} from '../constants'

function lookup(map: Record<string, string>, key: string): string {
  return map[key] ?? key
}

const ROOM_STATUS_LABELS: Record<string, string> = {
  [ROOM_STATUS.available]: STRINGS.roomStatus.available,
  [ROOM_STATUS.occupied]: STRINGS.roomStatus.occupied,
  [ROOM_STATUS.maintenance]: STRINGS.roomStatus.maintenance,
  [ROOM_STATUS.overdue]: STRINGS.roomStatus.overdue,
}

const ROOM_STATUS_TONES: Record<string, BadgeStatus> = {
  [ROOM_STATUS.available]: 'available',
  [ROOM_STATUS.occupied]: 'occupied',
  [ROOM_STATUS.maintenance]: 'maintenance',
  [ROOM_STATUS.overdue]: 'overdue',
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  [ROOM_TYPE.studio]: STRINGS.roomType.studio,
  [ROOM_TYPE.oneBedroom]: STRINGS.roomType.oneBedroom,
  [ROOM_TYPE.twoBedroom]: STRINGS.roomType.twoBedroom,
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  [CONTRACT_STATUS.active]: STRINGS.contractStatus.active,
  [CONTRACT_STATUS.expiring]: STRINGS.contractStatus.expiring,
  [CONTRACT_STATUS.terminated]: STRINGS.contractStatus.terminated,
  [CONTRACT_STATUS.overdue]: STRINGS.contractStatus.overdue,
}

const CONTRACT_STATUS_TONES: Record<string, BadgeStatus> = {
  [CONTRACT_STATUS.active]: 'positive',
  [CONTRACT_STATUS.expiring]: 'warning',
  [CONTRACT_STATUS.terminated]: 'neutral',
  [CONTRACT_STATUS.overdue]: 'occupied',
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  [INVOICE_STATUS.draft]: STRINGS.invoiceStatus.draft,
  [INVOICE_STATUS.sent]: STRINGS.invoiceStatus.sent,
  [INVOICE_STATUS.unpaid]: STRINGS.invoiceStatus.unpaid,
  [INVOICE_STATUS.partiallyPaid]: STRINGS.invoiceStatus.partiallyPaid,
  [INVOICE_STATUS.paid]: STRINGS.invoiceStatus.paid,
}

const INVOICE_STATUS_TONES: Record<string, BadgeStatus> = {
  [INVOICE_STATUS.draft]: 'neutral',
  [INVOICE_STATUS.sent]: 'warning',
  [INVOICE_STATUS.unpaid]: 'occupied',
  [INVOICE_STATUS.partiallyPaid]: 'maintenance',
  [INVOICE_STATUS.paid]: 'positive',
}

const LEAD_STATUS_LABELS: Record<string, string> = {
  [LEAD_STATUS.new]: STRINGS.leadStatus.new,
  [LEAD_STATUS.contacted]: STRINGS.leadStatus.contacted,
  [LEAD_STATUS.closed]: STRINGS.leadStatus.closed,
}

const LEAD_STATUS_TONES: Record<string, BadgeStatus> = {
  [LEAD_STATUS.new]: 'warning',
  [LEAD_STATUS.contacted]: 'positive',
  [LEAD_STATUS.closed]: 'neutral',
}

const ROLE_LABELS: Record<string, string> = {
  [USER_ROLE.admin]: STRINGS.role.admin,
  [USER_ROLE.manager]: STRINGS.role.manager,
  [USER_ROLE.tenant]: STRINGS.role.tenant,
}

const CYCLE_LABELS: Record<string, string> = {
  [PAYMENT_CYCLE.monthly]: STRINGS.paymentCycle.monthly,
  [PAYMENT_CYCLE.quarterly]: STRINGS.paymentCycle.quarterly,
}

const UNIT_LABELS: Record<string, string> = {
  [SERVICE_UNIT.perKwh]: STRINGS.serviceUnit.perKwh,
  [SERVICE_UNIT.perCubicMeter]: STRINGS.serviceUnit.perCubicMeter,
  [SERVICE_UNIT.perRoom]: STRINGS.serviceUnit.perRoom,
  [SERVICE_UNIT.perPerson]: STRINGS.serviceUnit.perPerson,
  [SERVICE_UNIT.perMonth]: STRINGS.serviceUnit.perMonth,
}

const CATEGORY_LABELS: Record<string, string> = {
  [SERVICE_CATEGORY.metered]: STRINGS.serviceCategory.metered,
  [SERVICE_CATEGORY.fixed]: STRINGS.serviceCategory.fixed,
}

export const roomStatusLabel = (value: string) => lookup(ROOM_STATUS_LABELS, value)
export const roomStatusTone = (value: string): BadgeStatus =>
  ROOM_STATUS_TONES[value] ?? 'neutral'
export const roomTypeLabel = (value: string) => lookup(ROOM_TYPE_LABELS, value)
export const contractStatusLabel = (value: string) => lookup(CONTRACT_STATUS_LABELS, value)
export const contractStatusTone = (value: string): BadgeStatus =>
  CONTRACT_STATUS_TONES[value] ?? 'neutral'
export const invoiceStatusLabel = (value: string) => lookup(INVOICE_STATUS_LABELS, value)
export const invoiceStatusTone = (value: string): BadgeStatus =>
  INVOICE_STATUS_TONES[value] ?? 'neutral'
export const leadStatusLabel = (value: string) => lookup(LEAD_STATUS_LABELS, value)
export const leadStatusTone = (value: string): BadgeStatus =>
  LEAD_STATUS_TONES[value] ?? 'neutral'
export const roleLabel = (value: string) => lookup(ROLE_LABELS, value)
export const paymentCycleLabel = (value: string) => lookup(CYCLE_LABELS, value)
export const serviceUnitLabel = (value: string) => lookup(UNIT_LABELS, value)
export const serviceCategoryLabel = (value: string) => lookup(CATEGORY_LABELS, value)

export const ROOM_STATUS_OPTIONS = Object.entries(ROOM_STATUS_LABELS)
export const ROOM_TYPE_OPTIONS = Object.entries(ROOM_TYPE_LABELS)
export const CONTRACT_STATUS_OPTIONS = Object.entries(CONTRACT_STATUS_LABELS)
export const INVOICE_STATUS_OPTIONS = Object.entries(INVOICE_STATUS_LABELS)
export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_LABELS)
export const ROLE_OPTIONS = Object.entries(ROLE_LABELS)
export const CYCLE_OPTIONS = Object.entries(CYCLE_LABELS)
export const UNIT_OPTIONS = Object.entries(UNIT_LABELS)
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS)
