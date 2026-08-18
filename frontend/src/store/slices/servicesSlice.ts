import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { servicesApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { ServiceInput, ServicePrice, ServiceUpdate } from '../../types/models'

interface ServicesState {
  entities: ServicePrice[]
  status: RequestStatus
  submitting: boolean
  error: string | null
}

const initialState: ServicesState = {
  entities: [],
  status: STATUS.idle,
  submitting: false,
  error: null,
}

export const fetchServices = createAsyncThunk(
  `${SLICE.services}/fetch`,
  async () => (await servicesApi.list()).data,
)

export const createService = createAsyncThunk(
  `${SLICE.services}/create`,
  async (payload: ServiceInput) => (await servicesApi.create(payload)).data,
)

export const updateService = createAsyncThunk(
  `${SLICE.services}/update`,
  async ({ id, payload }: { id: string; payload: ServiceUpdate }) =>
    (await servicesApi.update(id, payload)).data,
)

export const deleteService = createAsyncThunk(
  `${SLICE.services}/delete`,
  async (id: string) => {
    await servicesApi.remove(id)
    return id
  },
)

const servicesSlice = createSlice({
  name: SLICE.services,
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.entities = action.payload
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.submitting = false
        state.entities.push(action.payload)
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.submitting = false
        state.entities = state.entities.map((service) =>
          service.id === action.payload.id ? action.payload : service,
        )
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.submitting = false
        state.entities = state.entities.filter((service) => service.id !== action.payload)
      })

    for (const thunk of [createService, updateService, deleteService]) {
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

export const { clearError } = servicesSlice.actions
export default servicesSlice.reducer
