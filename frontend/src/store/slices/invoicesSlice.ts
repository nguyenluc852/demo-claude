import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { invoicesApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Invoice } from '../../types/models'

interface InvoicesState {
  entities: Invoice[]
  status: RequestStatus
  /** Invoice ids with a send or payment update in flight. */
  pendingIds: string[]
  statusFilter: string
  periodFilter: string
  notice: string | null
  error: string | null
}

const initialState: InvoicesState = {
  entities: [],
  status: STATUS.idle,
  pendingIds: [],
  statusFilter: '',
  periodFilter: '',
  notice: null,
  error: null,
}

interface InvoiceQuery {
  status?: string
  period?: string
}

export const fetchInvoices = createAsyncThunk(
  `${SLICE.invoices}/fetch`,
  async (query: InvoiceQuery) => (await invoicesApi.list(query.status, query.period)).data,
)

export const sendInvoice = createAsyncThunk(
  `${SLICE.invoices}/send`,
  async (id: string) => (await invoicesApi.send(id)).data,
)

export const recordPayment = createAsyncThunk(
  `${SLICE.invoices}/payment`,
  async ({ id, paidAmount }: { id: string; paidAmount: number }) =>
    (await invoicesApi.recordPayment(id, paidAmount)).data,
)

function replace(entities: Invoice[], updated: Invoice): Invoice[] {
  return entities.map((invoice) => (invoice.id === updated.id ? updated : invoice))
}

const invoicesSlice = createSlice({
  name: SLICE.invoices,
  initialState,
  reducers: {
    setStatusFilter: (state, action: { payload: string }) => {
      state.statusFilter = action.payload
    },
    setPeriodFilter: (state, action: { payload: string }) => {
      state.periodFilter = action.payload
    },
    clearNotice: (state) => {
      state.notice = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.entities = action.payload
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(sendInvoice.fulfilled, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg)
        state.entities = replace(state.entities, action.payload)
        state.notice = STRINGS.invoice.sentToast
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg.id)
        state.entities = replace(state.entities, action.payload)
      })
      .addCase(sendInvoice.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg)
        state.error = null
      })
      .addCase(recordPayment.pending, (state, action) => {
        state.pendingIds.push(action.meta.arg.id)
        state.error = null
      })
      .addCase(sendInvoice.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg)
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.pendingIds = state.pendingIds.filter((id) => id !== action.meta.arg.id)
        state.error = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export const { setStatusFilter, setPeriodFilter, clearNotice, clearError } =
  invoicesSlice.actions
export default invoicesSlice.reducer
