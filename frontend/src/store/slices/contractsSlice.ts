import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { authApi, contractsApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Contract, ContractInput, ContractUpdate } from '../../types/models'

interface ContractsState {
  entities: Contract[]
  status: RequestStatus
  submitting: boolean
  /** One id per row in flight: resending for one contract must not lock the grid. */
  resendingIds: string[]
  notice: string | null
  error: string | null
}

const initialState: ContractsState = {
  entities: [],
  status: STATUS.idle,
  submitting: false,
  resendingIds: [],
  notice: null,
  error: null,
}

export const fetchContracts = createAsyncThunk(
  `${SLICE.contracts}/fetch`,
  async () => (await contractsApi.list()).data,
)

export const createContract = createAsyncThunk(
  `${SLICE.contracts}/create`,
  async (payload: ContractInput) => (await contractsApi.create(payload)).data,
)

export const updateContract = createAsyncThunk(
  `${SLICE.contracts}/update`,
  async ({ id, payload }: { id: string; payload: ContractUpdate }) =>
    (await contractsApi.update(id, payload)).data,
)

export const deleteContract = createAsyncThunk(
  `${SLICE.contracts}/delete`,
  async (id: string) => {
    await contractsApi.remove(id)
    return id
  },
)

/** Sends the verification link again — the only way back when the provider
 *  refused it at signing time. */
export const resendVerification = createAsyncThunk(
  `${SLICE.contracts}/resendVerification`,
  async ({ id, email }: { id: string; email: string }) => {
    await authApi.resendVerification(email)
    return id
  },
)

const contractsSlice = createSlice({
  name: SLICE.contracts,
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearNotice: (state) => {
      state.notice = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.entities = action.payload
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.submitting = false
        state.entities.unshift(action.payload)
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.submitting = false
        state.entities = state.entities.map((contract) =>
          contract.id === action.payload.id ? action.payload : contract,
        )
      })
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.submitting = false
        state.entities = state.entities.filter((contract) => contract.id !== action.payload)
      })
      // Resending is tracked per row, not by `submitting`: it belongs to one
      // contract and must leave the rest of the grid usable.
      .addCase(resendVerification.pending, (state, action) => {
        state.resendingIds.push(action.meta.arg.id)
        state.error = null
        state.notice = null
      })
      .addCase(resendVerification.fulfilled, (state, action) => {
        state.resendingIds = state.resendingIds.filter((id) => id !== action.payload)
        state.notice = STRINGS.contract.verificationResent
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.resendingIds = state.resendingIds.filter((id) => id !== action.meta.arg.id)
        state.error = action.error.message ?? STRINGS.errors.generic
      })

    for (const thunk of [createContract, updateContract, deleteContract]) {
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

export const { clearError, clearNotice } = contractsSlice.actions
export default contractsSlice.reducer
