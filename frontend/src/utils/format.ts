import { CURRENCY, LOCALE, STRINGS } from '../constants'

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatNumber(value: number | null): string {
  return value === null ? STRINGS.common.unknown : numberFormatter.format(value)
}

export function formatDate(iso: string | null): string {
  return iso ? dateFormatter.format(new Date(iso)) : STRINGS.common.unknown
}

/** `YYYY-MM` for an <input type="month"> and for the period filters. */
export function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Trims a datetime to the `YYYY-MM-DD` an <input type="date"> expects. */
export function toDateInput(iso: string): string {
  return iso.slice(0, 10)
}
