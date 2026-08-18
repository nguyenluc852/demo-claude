import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { publicApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { LeadInput, PublicRoom } from '../../types/models'

interface PublicState {
  rooms: PublicRoom[]
  status: RequestStatus
  submitting: boolean
  /** Confirmation copy returned by the API after a contact form submission. */
  leadMessage: string | null
  error: string | null
}

const initialState: PublicState = {
  rooms: [],
  status: STATUS.idle,
  submitting: false,
  leadMessage: null,
  error: null,
}

export const fetchPublicRooms = createAsyncThunk(
  `${SLICE.publicSite}/rooms`,
  async () => (await publicApi.rooms()).data,
)

export const submitLead = createAsyncThunk(
  `${SLICE.publicSite}/lead`,
  async (payload: LeadInput) => (await publicApi.submitLead(payload)).data.message,
)

const publicSlice = createSlice({
  name: SLICE.publicSite,
  initialState,
  reducers: {
    clearLeadMessage: (state) => {
      state.leadMessage = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicRooms.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchPublicRooms.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.rooms = action.payload
      })
      .addCase(fetchPublicRooms.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(submitLead.pending, (state) => {
        state.submitting = true
        state.error = null
        state.leadMessage = null
      })
      .addCase(submitLead.fulfilled, (state, action) => {
        state.submitting = false
        state.leadMessage = action.payload
      })
      .addCase(submitLead.rejected, (state, action) => {
        state.submitting = false
        state.error = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export const { clearLeadMessage, clearError } = publicSlice.actions
export default publicSlice.reducer
