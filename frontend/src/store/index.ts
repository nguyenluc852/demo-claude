import { configureStore } from '@reduxjs/toolkit'

import { SLICE } from '../constants'
import authReducer from './slices/authSlice'
import contractsReducer from './slices/contractsSlice'
import dashboardReducer from './slices/dashboardSlice'
import healthReducer from './slices/healthSlice'
import invoicesReducer from './slices/invoicesSlice'
import leadsReducer from './slices/leadsSlice'
import metersReducer from './slices/metersSlice'
import publicReducer from './slices/publicSlice'
import roomsReducer from './slices/roomsSlice'
import servicesReducer from './slices/servicesSlice'
import tenantReducer from './slices/tenantSlice'
import usersReducer from './slices/usersSlice'

export const store = configureStore({
  reducer: {
    [SLICE.health]: healthReducer,
    [SLICE.auth]: authReducer,
    [SLICE.rooms]: roomsReducer,
    [SLICE.contracts]: contractsReducer,
    [SLICE.meters]: metersReducer,
    [SLICE.invoices]: invoicesReducer,
    [SLICE.services]: servicesReducer,
    [SLICE.users]: usersReducer,
    [SLICE.leads]: leadsReducer,
    [SLICE.dashboard]: dashboardReducer,
    [SLICE.publicSite]: publicReducer,
    [SLICE.tenant]: tenantReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
