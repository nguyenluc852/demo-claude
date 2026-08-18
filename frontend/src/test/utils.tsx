import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'

import { SLICE } from '../constants'
import authReducer from '../store/slices/authSlice'
import contractsReducer from '../store/slices/contractsSlice'
import dashboardReducer from '../store/slices/dashboardSlice'
import healthReducer from '../store/slices/healthSlice'
import invoicesReducer from '../store/slices/invoicesSlice'
import leadsReducer from '../store/slices/leadsSlice'
import metersReducer from '../store/slices/metersSlice'
import publicReducer from '../store/slices/publicSlice'
import roomsReducer from '../store/slices/roomsSlice'
import servicesReducer from '../store/slices/servicesSlice'
import tenantReducer from '../store/slices/tenantSlice'
import usersReducer from '../store/slices/usersSlice'

/** Fresh store per test so no state leaks between cases. */
export function makeStore() {
  return configureStore({
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
}

export function renderWithStore(ui: ReactElement, store = makeStore()) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  return { store, ...render(ui, { wrapper: Wrapper }) }
}
