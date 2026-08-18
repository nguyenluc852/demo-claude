import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { tenantApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Invoice, TenantOverview } from '../../types/models'

interface TenantState {
  overview: TenantOverview | null
  invoices: Invoice[]
  status: RequestStatus
  error: string | null
}

const initialState: TenantState = {
  overview: null,
  invoices: [],
  status: STATUS.idle,
  error: null,
}

export const fetchTenantOverview = createAsyncThunk(
  `${SLICE.tenant}/overview`,
  async () => (await tenantApi.overview()).data,
)

export const fetchTenantInvoices = createAsyncThunk(
  `${SLICE.tenant}/invoices`,
  async () => (await tenantApi.invoices()).data,
)

const tenantSlice = createSlice({
  name: SLICE.tenant,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenantOverview.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchTenantOverview.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.overview = action.payload
      })
      .addCase(fetchTenantOverview.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(fetchTenantInvoices.fulfilled, (state, action) => {
        state.invoices = action.payload
      })
      .addCase(fetchTenantInvoices.rejected, (state, action) => {
        state.error = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export default tenantSlice.reducer
