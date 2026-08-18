import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'

import { SLICE } from '../constants'
import healthReducer from '../store/slices/healthSlice'
import itemsReducer from '../store/slices/itemsSlice'

/** Fresh store per test so no state leaks between cases. */
export function makeStore() {
  return configureStore({
    reducer: {
      [SLICE.health]: healthReducer,
      [SLICE.items]: itemsReducer,
    },
  })
}

export function renderWithStore(ui: ReactElement, store = makeStore()) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  return { store, ...render(ui, { wrapper: Wrapper }) }
}
