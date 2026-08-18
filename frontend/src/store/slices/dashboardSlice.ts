import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { dashboardApi } from '../../api/endpoints'
import { REVENUE_RANGE, SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { DashboardSummary, RevenueSeries } from '../../types/models'

interface DashboardState {
  summary: DashboardSummary | null
  revenue: RevenueSeries | null
  months: number
  status: RequestStatus
  revenueStatus: RequestStatus
  error: string | null
}

const initialState: DashboardState = {
  summary: null,
  revenue: null,
  months: REVENUE_RANGE.year,
  status: STATUS.idle,
  revenueStatus: STATUS.idle,
  error: null,
}

export const fetchSummary = createAsyncThunk(
  `${SLICE.dashboard}/summary`,
  async () => (await dashboardApi.summary()).data,
)

export const fetchRevenue = createAsyncThunk(
  `${SLICE.dashboard}/revenue`,
  async (months: number) => (await dashboardApi.revenue(months)).data,
)

const dashboardSlice = createSlice({
  name: SLICE.dashboard,
  initialState,
  reducers: {
    setMonths: (state, action: { payload: number }) => {
      state.months = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.summary = action.payload
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(fetchRevenue.pending, (state) => {
        state.revenueStatus = STATUS.loading
      })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.revenueStatus = STATUS.succeeded
        state.revenue = action.payload
      })
      .addCase(fetchRevenue.rejected, (state, action) => {
        state.revenueStatus = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export const { setMonths } = dashboardSlice.actions
export default dashboardSlice.reducer
