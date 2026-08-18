import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from './index'

/** Typed wrappers — components must use these, never the raw react-redux hooks. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
