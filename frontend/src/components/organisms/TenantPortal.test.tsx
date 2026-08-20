import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  API_ROUTES,
  CONTRACT_STATUS,
  INVOICE_STATUS,
  PAYMENT_CYCLE,
  ROOM_STATUS,
  ROOM_TYPE,
  SERVICE_CODE,
  SERVICE_UNIT,
  STRINGS,
} from '../../constants'
import { renderWithStore } from '../../test/utils'
import type { Contract, Invoice, Room } from '../../types/models'
import { formatDate, formatMoney, formatNumber } from '../../utils/format'
import { serviceUnitLabel } from '../../utils/labels'
import { TenantPortal } from './TenantPortal'

afterEach(() => vi.unstubAllGlobals())

const ELECTRIC_NAME = 'Tiền điện'
const WATER_NAME = 'Tiền nước'

const room: Room = {
  id: 'room-1',
  room_number: '301',
  floor: 3,
  room_type: ROOM_TYPE.studio,
  area: 25,
  base_price: 2_000_000,
  amenities: ['Máy lạnh'],
  images: [],
  description: null,
  status: ROOM_STATUS.occupied,
  created_at: '2026-01-01T00:00:00',
}

const contract: Contract = {
  id: 'contract-1',
  room_id: room.id,
  room_number: room.room_number,
  tenant_name: 'Nguyen Van A',
  tenant_id_card: '079000000001',
  tenant_phone: '0900000000',
  tenant_email: 'tenant@example.com',
  start_date: '2026-01-01T00:00:00',
  end_date: '2026-12-31T00:00:00',
  deposit: 2_000_000,
  payment_cycle: PAYMENT_CYCLE.monthly,
  occupants: 1,
  note: null,
  status: CONTRACT_STATUS.active,
  email_verified: true,
  created_at: '2026-01-01T00:00:00',
}

/** room_charge 2.000.000 + 420.000 + 90.000 = 2.510.000; còn phải trả 1.500.000. */
const detailedInvoice: Invoice = {
  id: 'invoice-1',
  room_id: room.id,
  room_number: room.room_number,
  contract_id: contract.id,
  tenant_name: contract.tenant_name,
  tenant_email: contract.tenant_email,
  period: '2026-07',
  room_charge: 2_000_000,
  lines: [
    {
      code: SERVICE_CODE.electricity,
      name: ELECTRIC_NAME,
      unit: SERVICE_UNIT.perKwh,
      unit_price: 3_500,
      quantity: 120,
      amount: 420_000,
      meter_old: 100,
      meter_new: 220,
    },
    {
      code: SERVICE_CODE.water,
      name: WATER_NAME,
      unit: SERVICE_UNIT.perCubicMeter,
      unit_price: 15_000,
      quantity: 6,
      amount: 90_000,
      meter_old: 40,
      meter_new: 46,
    },
  ],
  total: 2_510_000,
  paid_amount: 1_010_000,
  status: INVOICE_STATUS.partiallyPaid,
  due_date: '2026-08-05T00:00:00',
  sent_at: '2026-08-01T00:00:00',
  created_at: '2026-08-01T00:00:00',
}

/**
 * Kỳ trước, cố ý dùng lượng tiêu thụ khác kỳ gần nhất: điện 80 vs 120 và nước
 * 4 vs 6, nên trung bình (100 và 5) không trùng với kỳ gần nhất — nếu component
 * lấy nhầm một trong hai số thì test phải đỏ.
 */
const olderInvoice: Invoice = {
  ...detailedInvoice,
  id: 'invoice-2',
  period: '2026-06',
  lines: [
    { ...detailedInvoice.lines[0]!, quantity: 80, amount: 280_000, meter_old: 20, meter_new: 100 },
    { ...detailedInvoice.lines[1]!, quantity: 4, amount: 60_000, meter_old: 36, meter_new: 40 },
  ],
  total: 2_340_000,
  paid_amount: 2_340_000,
  status: INVOICE_STATUS.paid,
}

/** Danh sách trả về theo thứ tự kỳ mới nhất trước, đúng như API thật. */
const INVOICES = [detailedInvoice, olderInvoice]

const ELECTRIC_LATEST = 120
const ELECTRIC_AVERAGE = 100
const WATER_LATEST = 6
const WATER_AVERAGE = 5

function stubTenantApi(invoices: Invoice[], activeContract: Contract = contract) {
  const fetchMock = vi.fn((input: string) => {
    if (input.endsWith(API_ROUTES.tenantMe)) {
      return Promise.resolve(Response.json({ data: { contract: activeContract, room } }))
    }
    if (input.endsWith(API_ROUTES.tenantInvoices)) {
      return Promise.resolve(
        Response.json({
          data: invoices,
          meta: { page: 1, size: invoices.length, total: invoices.length },
        }),
      )
    }
    throw new Error(`Unexpected request: ${input}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Waits for both thunks to settle so the portal has left its loading state. */
async function renderPortal(invoices: Invoice[] = INVOICES, activeContract?: Contract) {
  const fetchMock = stubTenantApi(invoices, activeContract)
  renderWithStore(<TenantPortal />)
  await screen.findByText(STRINGS.tenant.invoicesHeading)
  await waitFor(() =>
    expect(
      invoices.length === 0
        ? screen.getByText(STRINGS.tenant.invoicesEmpty)
        : screen.getByRole('table'),
    ).toBeInTheDocument(),
  )
  return fetchMock
}

/**
 * `formatMoney` separates the currency sign with a non-breaking space, which
 * Testing Library's default normalizer collapses on the DOM side only — so the
 * expected string has to go through the same collapsing to match.
 */
function money(amount: number): string {
  return formatMoney(amount).replace(/\s+/g, ' ')
}

/** Buttons carry the period in their accessible name, so the row is unambiguous. */
function detailButton(period: string) {
  return screen.getByRole('button', {
    name: `${STRINGS.tenant.invoiceDetailAction} ${period}`,
  })
}

function openDetail(period: string = detailedInvoice.period) {
  return userEvent.click(detailButton(period))
}

/** Reads the value out of the summary card carrying `label`. */
function statValue(label: string): string | null {
  const card = screen.getByText(label).closest('.stat') as HTMLElement
  return card.querySelector('.stat-value')?.textContent ?? null
}

const latestLabel = (series: string) => `${STRINGS.tenant.usageLatest} · ${series}`
const averageLabel = (series: string) => `${STRINGS.tenant.usageAverage} · ${series}`

describe('TenantPortal usage chart', () => {
  it('summarises the latest and the average of the electricity series', async () => {
    await renderPortal()

    const series = STRINGS.meter.columnElectric
    expect(statValue(latestLabel(series))).toBe(formatNumber(ELECTRIC_LATEST))
    expect(statValue(averageLabel(series))).toBe(formatNumber(ELECTRIC_AVERAGE))
  })

  it('switches the summary to the water series when that tab is picked', async () => {
    await renderPortal()

    await userEvent.click(screen.getByRole('tab', { name: STRINGS.meter.columnWater }))

    const series = STRINGS.meter.columnWater
    expect(statValue(latestLabel(series))).toBe(formatNumber(WATER_LATEST))
    expect(statValue(averageLabel(series))).toBe(formatNumber(WATER_AVERAGE))
    expect(screen.queryByText(latestLabel(STRINGS.meter.columnElectric))).toBeNull()
  })

  it('marks the selected series on the tab list', async () => {
    await renderPortal()

    expect(screen.getByRole('tab', { name: STRINGS.meter.columnElectric })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await userEvent.click(screen.getByRole('tab', { name: STRINGS.meter.columnWater }))

    expect(screen.getByRole('tab', { name: STRINGS.meter.columnWater })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('shows the empty chart message and no summary when there are no invoices', async () => {
    await renderPortal([])

    expect(screen.getByText(STRINGS.tenant.usageEmpty)).toBeInTheDocument()
    expect(screen.queryByText(latestLabel(STRINGS.meter.columnElectric))).toBeNull()
    expect(screen.queryByText(averageLabel(STRINGS.meter.columnElectric))).toBeNull()
  })
})

describe('TenantPortal invoice history', () => {
  it('renders the invoice history with no modal open', async () => {
    await renderPortal()

    expect(screen.getByText(detailedInvoice.period)).toBeInTheDocument()
    expect(screen.getByText(olderInvoice.period)).toBeInTheDocument()
    expect(detailButton(detailedInvoice.period)).toBeInTheDocument()
    expect(detailButton(olderInvoice.period)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('tells the tenant when there is no invoice at all', async () => {
    await renderPortal([])

    expect(screen.getByText(STRINGS.tenant.invoicesEmpty)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('opens a read-only detail modal listing the invoice lines', async () => {
    await renderPortal()

    await openDetail()

    const dialog = await screen.findByRole('dialog')
    const detail = within(dialog)

    expect(detail.getByText(STRINGS.invoice.rentLine)).toBeInTheDocument()
    expect(detail.getByText(ELECTRIC_NAME)).toBeInTheDocument()
    expect(detail.getByText(WATER_NAME)).toBeInTheDocument()
    expect(detail.getByText(serviceUnitLabel(SERVICE_UNIT.perKwh))).toBeInTheDocument()
    expect(detail.getByText(serviceUnitLabel(SERVICE_UNIT.perCubicMeter))).toBeInTheDocument()

    const electric = detailedInvoice.lines[0]!
    expect(detail.getByText(formatNumber(electric.quantity))).toBeInTheDocument()
    expect(detail.getByText(money(electric.unit_price))).toBeInTheDocument()
    expect(detail.getByText(money(electric.amount))).toBeInTheDocument()

    const water = detailedInvoice.lines[1]!
    expect(detail.getByText(money(water.unit_price))).toBeInTheDocument()
    expect(detail.getByText(money(water.amount))).toBeInTheDocument()

    expect(detail.getByText(formatDate(detailedInvoice.due_date))).toBeInTheDocument()
  })

  it('opens the row that was clicked, not always the first one', async () => {
    await renderPortal()

    await openDetail(olderInvoice.period)

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(money(olderInvoice.lines[0]!.amount)),
    ).toBeInTheDocument()
  })

  it('shows the outstanding amount as total minus paid', async () => {
    await renderPortal()

    await openDetail()

    const detail = within(await screen.findByRole('dialog'))
    const remaining = detailedInvoice.total - detailedInvoice.paid_amount

    expect(detail.getByText(STRINGS.tenant.invoiceRemainingLabel)).toBeInTheDocument()
    expect(detail.getByText(money(remaining))).toBeInTheDocument()
    expect(detail.getByText(money(detailedInvoice.total))).toBeInTheDocument()
    expect(detail.getByText(money(detailedInvoice.paid_amount))).toBeInTheDocument()
  })

  it('never exposes the staff-only invoice controls to a tenant', async () => {
    await renderPortal()

    await openDetail()

    const detail = within(await screen.findByRole('dialog'))
    for (const label of [
      STRINGS.invoice.paymentAction,
      STRINGS.invoice.sendAction,
      STRINGS.invoice.resendAction,
      STRINGS.invoice.markPaidAction,
      STRINGS.invoice.pdfAction,
    ]) {
      expect(detail.queryByRole('button', { name: label })).not.toBeInTheDocument()
      expect(detail.queryByText(label)).not.toBeInTheDocument()
    }
  })

  it('closes the modal again', async () => {
    await renderPortal()

    await openDetail()
    const dialog = await screen.findByRole('dialog')

    await userEvent.click(within(dialog).getByRole('button', { name: STRINGS.common.close }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
