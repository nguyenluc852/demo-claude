import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ROOM_STATUS, ROOM_TYPE, STRINGS } from '../../constants'
import { renderWithStore } from '../../test/utils'
import type { PublicRoom } from '../../types/models'
import { RoomShowcase } from './RoomShowcase'

afterEach(() => vi.unstubAllGlobals())

function makeRoom(overrides: Partial<PublicRoom> & { id: string }): PublicRoom {
  return {
    room_number: overrides.id,
    floor: 1,
    room_type: ROOM_TYPE.studio,
    area: 24,
    base_price: 3_500_000,
    amenities: ['Wifi'],
    images: [],
    description: null,
    status: ROOM_STATUS.available,
    ...overrides,
  }
}

const rooms: PublicRoom[] = [
  makeRoom({ id: '101', room_type: ROOM_TYPE.studio, status: ROOM_STATUS.available }),
  makeRoom({ id: '102', room_type: ROOM_TYPE.studio, status: ROOM_STATUS.occupied }),
  makeRoom({ id: '201', room_type: ROOM_TYPE.oneBedroom, status: ROOM_STATUS.available }),
  makeRoom({ id: '202', room_type: ROOM_TYPE.twoBedroom, status: ROOM_STATUS.occupied }),
]

function stubRooms() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({ data: rooms, meta: { page: 1, size: 20, total: rooms.length } }),
    ),
  )
}

/** One booking button per rendered card, so this counts the visible grid. */
function cardCount(): number {
  return screen.queryAllByRole('button', { name: STRINGS.room.bookThisRoom }).length
}

describe('RoomShowcase', () => {
  it('narrows the grid down to the rooms of the selected type', async () => {
    stubRooms()
    renderWithStore(<RoomShowcase onBookRoom={vi.fn()} />)

    await waitFor(() => expect(cardCount()).toBe(rooms.length))

    await userEvent.selectOptions(
      screen.getByLabelText(STRINGS.home.filterTypeLabel),
      ROOM_TYPE.studio,
    )

    expect(cardCount()).toBe(2)
    expect(screen.queryByText(STRINGS.home.filterEmpty)).not.toBeInTheDocument()
  })

  it('reports an empty result when no room matches both filters', async () => {
    stubRooms()
    renderWithStore(<RoomShowcase onBookRoom={vi.fn()} />)

    await waitFor(() => expect(cardCount()).toBe(rooms.length))

    await userEvent.selectOptions(
      screen.getByLabelText(STRINGS.home.filterTypeLabel),
      ROOM_TYPE.twoBedroom,
    )
    await userEvent.selectOptions(
      screen.getByLabelText(STRINGS.home.filterStatusLabel),
      ROOM_STATUS.available,
    )

    expect(cardCount()).toBe(0)
    expect(screen.getByText(STRINGS.home.filterEmpty)).toBeInTheDocument()
  })
})
