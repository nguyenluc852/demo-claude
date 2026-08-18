import { describe, expect, it } from 'vitest'

import { METER_FILTER, STATUS } from '../../constants'
import type { MeterRow } from '../../types/models'
import reducer, { fetchMeterGrid, saveReading, setFilter } from './metersSlice'

const ROOM_ID = 'room-1'

const row: MeterRow = {
  room_id: ROOM_ID,
  room_number: '101',
  floor: 1,
  contract_id: 'contract-1',
  tenant_name: 'Nguyen Van A',
  period: '2026-08',
  electric_old: 100,
  electric_new: null,
  water_old: 10,
  water_new: null,
  invoice_id: null,
}

function initial() {
  return reducer(undefined, { type: '@@init' })
}

describe('metersSlice', () => {
  it('stores the grid returned by the API', () => {
    const state = reducer(initial(), {
      type: fetchMeterGrid.fulfilled.type,
      payload: [row],
    })

    expect(state.status).toBe(STATUS.succeeded)
    expect(state.rows).toEqual([row])
  })

  it('keeps the tab filter that was selected', () => {
    const state = reducer(initial(), setFilter(METER_FILTER.missingWater))

    expect(state.filter).toBe(METER_FILTER.missingWater)
  })

  it('marks a row as saving so its inputs can lock', () => {
    const state = reducer(initial(), {
      type: saveReading.pending.type,
      meta: { arg: { roomId: ROOM_ID } },
    })

    expect(state.savingRoomIds).toContain(ROOM_ID)
  })

  it('releases the lock and replaces the row once the save lands', () => {
    const saving = reducer(
      { ...initial(), rows: [row] },
      { type: saveReading.pending.type, meta: { arg: { roomId: ROOM_ID } } },
    )
    const saved = { ...row, electric_new: 150, water_new: 12, invoice_id: 'invoice-1' }

    const state = reducer(saving, {
      type: saveReading.fulfilled.type,
      payload: saved,
      meta: { arg: { roomId: ROOM_ID } },
    })

    expect(state.savingRoomIds).not.toContain(ROOM_ID)
    expect(state.savedRoomIds).toContain(ROOM_ID)
    expect(state.rows[0]).toEqual(saved)
  })

  it('releases the lock and surfaces the message when the save fails', () => {
    const saving = reducer(initial(), {
      type: saveReading.pending.type,
      meta: { arg: { roomId: ROOM_ID } },
    })

    const state = reducer(saving, {
      type: saveReading.rejected.type,
      error: { message: 'boom' },
      meta: { arg: { roomId: ROOM_ID } },
    })

    expect(state.savingRoomIds).not.toContain(ROOM_ID)
    expect(state.error).toBe('boom')
  })
})
