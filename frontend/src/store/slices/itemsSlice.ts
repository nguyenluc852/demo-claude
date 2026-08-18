import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { itemsApi } from '../../api/endpoints'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { Item, ItemCreate } from '../../types/models'

interface ItemsState {
  entities: Item[]
  total: number
  status: RequestStatus
  error: string | null
}

const initialState: ItemsState = {
  entities: [],
  total: 0,
  status: STATUS.idle,
  error: null,
}

export const fetchItems = createAsyncThunk(`${SLICE.items}/fetch`, async () => {
  return itemsApi.list()
})

export const createItem = createAsyncThunk(
  `${SLICE.items}/create`,
  async (payload: ItemCreate) => {
    const response = await itemsApi.create(payload)
    return response.data
  },
)

export const deleteItem = createAsyncThunk(`${SLICE.items}/delete`, async (id: number) => {
  await itemsApi.remove(id)
  return id
})

const itemsSlice = createSlice({
  name: SLICE.items,
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.status = STATUS.loading
        state.error = null
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.entities = action.payload.data
        state.total = action.payload.meta.total
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.status = STATUS.failed
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.entities.push(action.payload)
        state.total += 1
        state.error = null
      })
      .addCase(createItem.rejected, (state, action) => {
        state.error = action.error.message ?? STRINGS.errors.generic
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.entities = state.entities.filter((item) => item.id !== action.payload)
        state.total -= 1
      })
  },
})

export const { clearError } = itemsSlice.actions
export default itemsSlice.reducer
