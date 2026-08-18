import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { roomsApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Room, RoomGridItem, RoomInput } from '../../types/models'

interface RoomsState {
  entities: Room[]
  grid: RoomGridItem[]
  status: RequestStatus
  gridStatus: RequestStatus
  submitting: boolean
  error: string | null
}

const initialState: RoomsState = {
  entities: [],
  grid: [],
  status: STATUS.idle,
  gridStatus: STATUS.idle,
  submitting: false,
  error: null,
}

export const fetchRooms = createAsyncThunk(
  `${SLICE.rooms}/fetch`,
  async (search: string | undefined) => (await roomsApi.list(search)).data,
)

export const fetchRoomGrid = createAsyncThunk(
  `${SLICE.rooms}/grid`,
  async () => (await roomsApi.grid()).data,
)

export const createRoom = createAsyncThunk(
  `${SLICE.rooms}/create`,
  async (payload: RoomInput) => (await roomsApi.create(payload)).data,
)

export const updateRoom = createAsyncThunk(
  `${SLICE.rooms}/update`,
  async ({ id, payload }: { id: string; payload: Partial<RoomInput> }) =>
    (await roomsApi.update(id, payload)).data,
)

export const deleteRoom = createAsyncThunk(`${SLICE.rooms}/delete`, async (id: string) => {
  await roomsApi.remove(id)
  return id
})

const roomsSlice = createSlice({
  name: SLICE.rooms,
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.entities = action.payload
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(fetchRoomGrid.pending, (state) => {
        state.gridStatus = STATUS.loading
      })
      .addCase(fetchRoomGrid.fulfilled, (state, action) => {
        state.gridStatus = STATUS.succeeded
        state.grid = action.payload
      })
      .addCase(fetchRoomGrid.rejected, (state, action) => {
        state.gridStatus = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.submitting = false
        state.entities.push(action.payload)
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.submitting = false
        state.entities = state.entities.map((room) =>
          room.id === action.payload.id ? action.payload : room,
        )
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.submitting = false
        state.entities = state.entities.filter((room) => room.id !== action.payload)
      })

    // Every mutation shares one submitting flag — it drives the modal overlay
    // that blocks a second click while the request is in flight.
    for (const thunk of [createRoom, updateRoom, deleteRoom]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.submitting = true
          state.error = null
        })
        .addCase(thunk.rejected, (state, action) => {
          state.submitting = false
          state.error = action.error.message ?? STRINGS.errors.generic
        })
    }
  },
})

export const { clearError } = roomsSlice.actions
export default roomsSlice.reducer
