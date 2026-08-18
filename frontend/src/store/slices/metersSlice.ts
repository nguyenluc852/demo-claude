import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { metersApi } from '../../api/endpoints'
import { METER_FILTER, SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { MeterRow, MeterSave } from '../../types/models'

interface MetersState {
  rows: MeterRow[]
  status: RequestStatus
  /** Room ids with a save in flight — the grid disables just those rows. */
  savingRoomIds: string[]
  /** Room ids whose last save succeeded, so the row can confirm itself. */
  savedRoomIds: string[]
  period: string
  filter: string
  search: string
  error: string | null
}

interface MeterQuery {
  period?: string
  filter?: string
  search?: string
}

const initialState: MetersState = {
  rows: [],
  status: STATUS.idle,
  savingRoomIds: [],
  savedRoomIds: [],
  period: '',
  filter: METER_FILTER.all,
  search: '',
  error: null,
}

export const fetchMeterGrid = createAsyncThunk(
  `${SLICE.meters}/fetch`,
  async (query: MeterQuery) =>
    (await metersApi.grid(query.period, query.filter, query.search)).data,
)

export const saveReading = createAsyncThunk(
  `${SLICE.meters}/save`,
  async ({ roomId, payload }: { roomId: string; payload: MeterSave }) =>
    (await metersApi.save(roomId, payload)).data,
)

const metersSlice = createSlice({
  name: SLICE.meters,
  initialState,
  reducers: {
    setPeriod: (state, action: { payload: string }) => {
      state.period = action.payload
    },
    setFilter: (state, action: { payload: string }) => {
      state.filter = action.payload
    },
    setSearch: (state, action: { payload: string }) => {
      state.search = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeterGrid.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchMeterGrid.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.rows = action.payload
      })
      .addCase(fetchMeterGrid.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(saveReading.pending, (state, action) => {
        state.savingRoomIds.push(action.meta.arg.roomId)
        state.savedRoomIds = state.savedRoomIds.filter((id) => id !== action.meta.arg.roomId)
        state.error = null
      })
      .addCase(saveReading.fulfilled, (state, action) => {
        const { roomId } = action.meta.arg
        state.savingRoomIds = state.savingRoomIds.filter((id) => id !== roomId)
        state.savedRoomIds.push(roomId)
        state.rows = state.rows.map((row) =>
          row.room_id === roomId ? action.payload : row,
        )
      })
      .addCase(saveReading.rejected, (state, action) => {
        state.savingRoomIds = state.savingRoomIds.filter(
          (id) => id !== action.meta.arg.roomId,
        )
        state.error = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export const { setPeriod, setFilter, setSearch, clearError } = metersSlice.actions
export default metersSlice.reducer
