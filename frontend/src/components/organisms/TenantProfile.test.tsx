import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  API_ROUTES,
  CONTRACT_STATUS,
  PAYMENT_CYCLE,
  ROOM_STATUS,
  ROOM_TYPE,
  STRINGS,
} from '../../constants'
import { renderWithStore } from '../../test/utils'
import type { Contract, Room, TenantBalance } from '../../types/models'
import { formatDate, formatMoney } from '../../utils/format'
import {
  contractStatusLabel,
  paymentCycleLabel,
  roomStatusLabel,
  roomTypeLabel,
} from '../../utils/labels'
import { TenantProfile } from './TenantProfile'

afterEach(() => vi.unstubAllGlobals())

const AMENITY = 'Máy lạnh'

const room: Room = {
  id: 'room-1',
  room_number: '301',
  floor: 3,
  room_type: ROOM_TYPE.studio,
  area: 25,
  base_price: 2_400_000,
  amenities: [AMENITY],
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

const NOTE = 'Đã bàn giao 2 chìa khoá'
const contractWithNote: Contract = { ...contract, note: NOTE }

/** The overview envelope always carries a balance; this screen just ignores it. */
const balance: TenantBalance = {
  outstanding: 0,
  current_due: 0,
  previous_due: 0,
  current_period: null,
  due_date: null,
  unpaid_count: 0,
}

function stubTenantApi(activeContract: Contract) {
  const fetchMock = vi.fn((input: string) => {
    if (input.endsWith(API_ROUTES.tenantMe)) {
      return Promise.resolve(
        Response.json({ data: { contract: activeContract, room, balance } }),
      )
    }
    throw new Error(`Unexpected request: ${input}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function renderProfile(activeContract: Contract = contract) {
  const fetchMock = stubTenantApi(activeContract)
  renderWithStore(<TenantProfile />)
  await screen.findByText(STRINGS.tenant.profileHeading)
  return fetchMock
}

/**
 * Deposit and rent can round to the same amount, so every assertion is scoped to
 * the card it belongs to rather than to the whole page.
 */
function sectionOf(heading: string) {
  return within(screen.getByRole('heading', { name: heading }).closest('section') as HTMLElement)
}

const personal = () => sectionOf(STRINGS.tenant.profileHeading)
const contractCard = () => sectionOf(STRINGS.tenant.contractHeading)
const roomCard = () => sectionOf(`${STRINGS.tenant.roomHeading} · ${room.room_number}`)

/** `formatMoney` uses a non-breaking space the DOM normalizer collapses. */
function money(amount: number): string {
  return formatMoney(amount).replace(/\s+/g, ' ')
}

describe('TenantProfile', () => {
  it('renders every personal detail taken from the contract', async () => {
    await renderProfile()

    const section = personal()
    for (const [label, value] of [
      [STRINGS.tenant.profileName, contract.tenant_name],
      [STRINGS.tenant.profilePhone, contract.tenant_phone],
      [STRINGS.tenant.profileEmail, contract.tenant_email],
      [STRINGS.tenant.profileIdCard, contract.tenant_id_card],
      [
        STRINGS.tenant.profileOccupants,
        `${contract.occupants} ${STRINGS.tenant.profileOccupantsUnit}`,
      ],
    ] as const) {
      expect(section.getByText(label)).toBeInTheDocument()
      expect(section.getByText(value)).toBeInTheDocument()
    }
  })

  it('renders the contract terms and its derived status', async () => {
    await renderProfile()

    const section = contractCard()
    expect(section.getByText(STRINGS.contract.startLabel)).toBeInTheDocument()
    expect(section.getByText(formatDate(contract.start_date))).toBeInTheDocument()
    expect(section.getByText(STRINGS.contract.endLabel)).toBeInTheDocument()
    expect(section.getByText(formatDate(contract.end_date))).toBeInTheDocument()
    expect(section.getByText(STRINGS.contract.depositLabel)).toBeInTheDocument()
    expect(section.getByText(money(contract.deposit))).toBeInTheDocument()
    expect(section.getByText(STRINGS.contract.cycleLabel)).toBeInTheDocument()
    expect(section.getByText(paymentCycleLabel(contract.payment_cycle))).toBeInTheDocument()
    expect(section.getByText(contractStatusLabel(contract.status))).toBeInTheDocument()
  })

  it('renders the room card with its status and amenities', async () => {
    await renderProfile()

    const section = roomCard()
    expect(section.getByText(STRINGS.room.typeLabel)).toBeInTheDocument()
    expect(section.getByText(roomTypeLabel(room.room_type))).toBeInTheDocument()
    expect(section.getByText(`${room.area} ${STRINGS.room.areaUnit}`)).toBeInTheDocument()
    expect(section.getByText(money(room.base_price))).toBeInTheDocument()
    expect(section.getByText(String(room.floor))).toBeInTheDocument()
    expect(section.getByText(roomStatusLabel(room.status))).toBeInTheDocument()
    // `<p><Text>` nests, so both the paragraph and the span match the text.
    expect(section.getAllByText(AMENITY).length).toBeGreaterThan(0)
  })

  it('shows the contract note only when there is one', async () => {
    await renderProfile(contractWithNote)

    expect(
      personal().getAllByText(`${STRINGS.tenant.profileNote}: ${NOTE}`).length,
    ).toBeGreaterThan(0)
  })

  it('omits the note line when the contract has none', async () => {
    await renderProfile()

    expect(contract.note).toBeNull()
    expect(personal().queryByText(STRINGS.tenant.profileNote, { exact: false })).toBeNull()
  })
})
