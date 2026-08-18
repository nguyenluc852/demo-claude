import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { usersApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { User, UserUpdate } from '../../types/models'

interface UsersState {
  entities: User[]
  status: RequestStatus
  pendingIds: string[]
  error: string | null
}

const initialState: UsersState = {
  entities: [],
  status: STATUS.idle,
  pendingIds: [],
  error: null,
}

export const fetchUsers = createAsyncThunk(
  `${SLICE.users}/fetch`,
  async () => (await usersApi.list()).data,
)

export const updateUser = createAsyncThunk(
  `${SLICE.users}/update`,
  async ({ id, payload }: { id: string; payload: UserUpdate }) =>
    (await usersApi.update(id, payload)).data,
)

export const deleteUser = createAsyncThunk(`${SLICE.users}/delete`, async (id: string) => {
  await usersApi.remove(id)
  return id
})

const usersSlice = createSlice({
  name: SLICE.users,
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.entities = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(updateUser.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg.id)
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg.id)
        state.entities = state.entities.map((user) =>
          user.id === action.payload.id ? action.payload : user,
        )
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg.id)
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(deleteUser.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg)
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.payload)
        state.entities = state.entities.filter((user) => user.id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg)
        state.error = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export const { clearError } = usersSlice.actions
export default usersSlice.reducer
