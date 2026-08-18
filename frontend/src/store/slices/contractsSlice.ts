import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { contractsApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Contract, ContractInput, ContractUpdate } from '../../types/models'

interface ContractsState {
  entities: Contract[]
  status: RequestStatus
  submitting: boolean
  error: string | null
}

const initialState: ContractsState = {
  entities: [],
  status: STATUS.idle,
  submitting: false,
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

const contractsSlice = createSlice({
  name: SLICE.contracts,
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
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

export const { clearError } = contractsSlice.actions
export default contractsSlice.reducer
