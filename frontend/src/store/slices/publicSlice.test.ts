import { afterEach, describe, expect, it, vi } from 'vitest'

import { ROOM_STATUS, ROOM_TYPE, SLICE, STATUS } from '../../constants'
import { makeStore } from '../../test/utils'
import type { LeadInput, PublicRoom } from '../../types/models'
import { fetchPublicRooms, submitLead } from './publicSlice'

afterEach(() => vi.unstubAllGlobals())

const room: PublicRoom = {
  id: 'room-1',
  room_number: '101',
  floor: 1,
  room_type: ROOM_TYPE.studio,
  area: 24,
  base_price: 3_500_000,
  amenities: ['Wifi'],
  images: ['/img/101.jpg'],
  description: null,
  status: ROOM_STATUS.available,
}

const lead: LeadInput = { name: 'Khach', phone: '0900000000' }

const CONFIRMATION = 'Đã nhận thông tin.'
const ERROR_MESSAGE = 'Số điện thoại không hợp lệ'
const ERROR_CODE = 'BAD_REQUEST'

describe('publicSlice', () => {
  it('stores the rooms the public listing returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ data: [room], meta: { page: 1, size: 20, total: 1 } }),
      ),
    )
    const store = makeStore()

    await store.dispatch(fetchPublicRooms())

    const state = store.getState()[SLICE.publicSite]
    expect(state.status).toBe(STATUS.succeeded)
    expect(state.rooms).toEqual([room])
    expect(state.error).toBeNull()
  })

  it('keeps the confirmation copy returned for a submitted lead', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ data: { message: CONFIRMATION } }, { status: 201 }),
      ),
    )
    const store = makeStore()

    await store.dispatch(submitLead(lead))

    const state = store.getState()[SLICE.publicSite]
    expect(state.leadMessage).toBe(CONFIRMATION)
    expect(state.submitting).toBe(false)
    expect(state.error).toBeNull()
  })

  it('surfaces the error envelope when the lead is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          { error: { code: ERROR_CODE, message: ERROR_MESSAGE } },
          { status: 400 },
        ),
      ),
    )
    const store = makeStore()

    await store.dispatch(submitLead(lead))

    const state = store.getState()[SLICE.publicSite]
    expect(state.error).toBe(ERROR_MESSAGE)
    expect(state.leadMessage).toBeNull()
    expect(state.submitting).toBe(false)
  })
})
