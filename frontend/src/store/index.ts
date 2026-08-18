import { configureStore } from '@reduxjs/toolkit'

import { SLICE } from '../constants'
import healthReducer from './slices/healthSlice'
import itemsReducer from './slices/itemsSlice'

export const store = configureStore({
  reducer: {
    [SLICE.health]: healthReducer,
    [SLICE.items]: itemsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
