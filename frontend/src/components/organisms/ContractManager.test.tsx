import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
import type { Contract, Room } from '../../types/models'
import { ContractManager } from './ContractManager'

afterEach(() => vi.unstubAllGlobals())

const room: Room = {
  id: 'room-1',
  room_number: '301',
  floor: 3,
  room_type: ROOM_TYPE.studio,
  area: 25,
  base_price: 2_000_000,
  amenities: [],
  images: [],
  description: null,
  status: ROOM_STATUS.occupied,
  created_at: '2026-01-01T00:00:00',
}

const unverified: Contract = {
  id: 'contract-1',
  room_id: room.id,
  room_number: room.room_number,
  tenant_name: 'Nguyen Van A',
  tenant_id_card: '079000000001',
  tenant_phone: '0900000000',
  tenant_email: 'unverified@example.com',
  start_date: '2026-01-01T00:00:00',
  end_date: '2026-12-31T00:00:00',
  deposit: 2_000_000,
  payment_cycle: PAYMENT_CYCLE.monthly,
  occupants: 1,
  note: null,
  status: CONTRACT_STATUS.active,
  email_verified: false,
  created_at: '2026-01-01T00:00:00',
}

const verified: Contract = {
  ...unverified,
  id: 'contract-2',
  room_id: 'room-2',
  room_number: '302',
  tenant_name: 'Nguyen Van B',
  tenant_email: 'verified@example.com',
  email_verified: true,
}

/** A second unverified row, so "only this row is busy" has something to compare against. */
const alsoUnverified: Contract = {
  ...unverified,
  id: 'contract-3',
  room_id: 'room-3',
  room_number: '303',
  tenant_name: 'Nguyen Van C',
  tenant_email: 'other@example.com',
}

interface ResendCall {
  body: unknown
}

/**
 * `resend` decides how the resend request settles: `undefined` resolves it
 * immediately, a promise holds it open so the pending state can be observed.
 */
function stubApi(contracts: Contract[], resend?: Promise<void>) {
  const calls: ResendCall[] = []

  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    if (input.includes(API_ROUTES.authResendVerification)) {
      calls.push({ body: JSON.parse(String(init?.body ?? 'null')) })
      const done = () => Response.json({ data: { message: STRINGS.contract.verificationResent } })
      return resend ? resend.then(done) : Promise.resolve(done())
    }
    if (input.includes(API_ROUTES.contracts)) {
      return Promise.resolve(
        Response.json({
          data: contracts,
          meta: { page: 1, size: contracts.length, total: contracts.length },
        }),
      )
    }
    if (input.includes(API_ROUTES.rooms)) {
      return Promise.resolve(
        Response.json({ data: [room], meta: { page: 1, size: 1, total: 1 } }),
      )
    }
    throw new Error(`Unexpected request: ${input}`)
  })

  vi.stubGlobal('fetch', fetchMock)
  return calls
}

async function renderManager(contracts: Contract[], resend?: Promise<void>) {
  const calls = stubApi(contracts, resend)
  renderWithStore(<ContractManager />)
  await screen.findByText(contracts[0]!.tenant_email)
  return calls
}

/** The row a given tenant sits in, so a button belongs to exactly one contract. */
function row(contract: Contract) {
  return within(screen.getByText(contract.tenant_email).closest('tr') as HTMLElement)
}

function resendButton(contract: Contract) {
  return row(contract).getByRole('button', {
    name: STRINGS.contract.resendVerificationAction,
  })
}

describe('ContractManager verification resend', () => {
  it('offers the resend link only on a tenant who has not verified yet', async () => {
    await renderManager([unverified, verified])

    expect(resendButton(unverified)).toBeInTheDocument()
    expect(
      row(verified).queryByRole('button', {
        name: STRINGS.contract.resendVerificationAction,
      }),
    ).toBeNull()
  })

  it('posts the address of that contract and confirms the link went out', async () => {
    const calls = await renderManager([unverified, verified])

    await userEvent.click(resendButton(unverified))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]!.body).toEqual({ email: unverified.tenant_email })
    expect(await screen.findByText(STRINGS.contract.verificationResent)).toBeInTheDocument()
  })

  // Resending belongs to one row. Tracking it with the shared `submitting` flag
  // would lock the whole grid, which is what `async-ui-state` forbids.
  it('leaves the other rows usable while one link is being sent', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    await renderManager([unverified, alsoUnverified], pending)

    await userEvent.click(resendButton(unverified))

    await waitFor(() =>
      expect(row(unverified).getByRole('button', { name: STRINGS.contract.resendingVerification }))
        .toBeDisabled(),
    )
    expect(resendButton(alsoUnverified)).toBeEnabled()

    release()
    await screen.findByText(STRINGS.contract.verificationResent)
  })
})
