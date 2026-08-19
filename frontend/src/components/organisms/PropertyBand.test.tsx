import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ROOM_STATUS, ROOM_TYPE, STRINGS } from '../../constants'
import { makeStore, renderWithStore } from '../../test/utils'
import { fetchPublicRooms } from '../../store/slices/publicSlice'
import type { PublicRoom } from '../../types/models'
import { formatMoney } from '../../utils/format'
import { PropertyBand } from './PropertyBand'

/** Reduced motion makes useCountUp land on its final value synchronously. */
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} }),
  )
})

afterEach(() => vi.unstubAllGlobals())

function makeRoom(overrides: Partial<PublicRoom> & { id: string }): PublicRoom {
  return {
    room_number: overrides.id,
    floor: 1,
    room_type: ROOM_TYPE.studio,
    area: 24,
    base_price: 3_500_000,
    amenities: [],
    images: [],
    description: null,
    status: ROOM_STATUS.available,
    ...overrides,
  }
}

const rooms: PublicRoom[] = [
  makeRoom({ id: '101', base_price: 4_000_000, area: 30, status: ROOM_STATUS.available }),
  makeRoom({ id: '102', base_price: 2_800_000, area: 22, status: ROOM_STATUS.occupied }),
  makeRoom({ id: '201', base_price: 5_200_000, area: 41, status: ROOM_STATUS.available }),
]

function storeWith(seed: PublicRoom[]) {
  const store = makeStore()
  store.dispatch({ type: fetchPublicRooms.fulfilled.type, payload: seed })
  return store
}

/** The tile markup pairs the figure with its label inside one container. */
function tileValue(label: string): string {
  const tile = screen.getByText(label).parentElement
  return tile?.querySelector('strong')?.textContent ?? ''
}

describe('PropertyBand', () => {
  it('counts the four figures off the rooms in the store', () => {
    renderWithStore(<PropertyBand />, storeWith(rooms))

    expect(tileValue(STRINGS.home.statRooms)).toBe(String(rooms.length))
    expect(tileValue(STRINGS.home.statAvailable)).toBe('2')
    expect(tileValue(STRINGS.home.statFromPrice)).toBe(formatMoney(2_800_000))
    expect(tileValue(STRINGS.home.statMaxArea)).toBe(`41 ${STRINGS.room.areaUnit}`)
  })

  it('renders zeroes instead of infinities when no room has loaded yet', () => {
    renderWithStore(<PropertyBand />, storeWith([]))

    expect(tileValue(STRINGS.home.statRooms)).toBe('0')
    expect(tileValue(STRINGS.home.statAvailable)).toBe('0')
    expect(tileValue(STRINGS.home.statFromPrice)).toBe(formatMoney(0))
    expect(tileValue(STRINGS.home.statMaxArea)).toBe(`0 ${STRINGS.room.areaUnit}`)
  })
})
