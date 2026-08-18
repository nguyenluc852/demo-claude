import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { leadsApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Lead } from '../../types/models'

interface LeadsState {
  entities: Lead[]
  status: RequestStatus
  pendingIds: string[]
  error: string | null
}

const initialState: LeadsState = {
  entities: [],
  status: STATUS.idle,
  pendingIds: [],
  error: null,
}

export const fetchLeads = createAsyncThunk(
  `${SLICE.leads}/fetch`,
  async () => (await leadsApi.list()).data,
)

export const updateLeadStatus = createAsyncThunk(
  `${SLICE.leads}/update`,
  async ({ id, status }: { id: string; status: string }) =>
    (await leadsApi.update(id, status)).data,
)

export const deleteLead = createAsyncThunk(`${SLICE.leads}/delete`, async (id: string) => {
  await leadsApi.remove(id)
  return id
})

const leadsSlice = createSlice({
  name: SLICE.leads,
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.entities = action.payload
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(updateLeadStatus.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg.id)
      })
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg.id)
        state.entities = state.entities.map((lead) =>
          lead.id === action.payload.id ? action.payload : lead,
        )
      })
      .addCase(updateLeadStatus.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg.id)
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(deleteLead.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg)
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.payload)
        state.entities = state.entities.filter((lead) => lead.id !== action.payload)
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg)
        state.error = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export const { clearError } = leadsSlice.actions
export default leadsSlice.reducer
