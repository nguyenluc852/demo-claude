import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { healthApi } from '../../api/endpoints'
import { SLICE, STATUS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Health } from '../../types/models'

interface HealthState {
  data: Health | null
  status: RequestStatus
}

const initialState: HealthState = {
  data: null,
  status: STATUS.idle,
}

export const fetchHealth = createAsyncThunk(`${SLICE.health}/fetch`, async () => {
  const response = await healthApi.get()
  return response.data
})

const healthSlice = createSlice({
  name: SLICE.health,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.pending, (state) => {
        state.status = STATUS.loading
      })
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.data = action.payload
      })
      .addCase(fetchHealth.rejected, (state) => {
        state.status = STATUS.failed
        state.data = null
      })
  },
})

export default healthSlice.reducer
