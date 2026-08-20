import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { authApi } from '../../api/endpoints'
import { loadStoredToken, setAuthToken } from '../../api/client'
import { SLICE, STATUS, STRINGS } from '../../constants'
import type { RequestStatus } from '../../types/api'
import type { LoginRequest, RegisterRequest, User } from '../../types/models'

interface AuthState {
  user: User | null
  token: string | null
  status: RequestStatus
  /** Separate from `status` so a failed login does not blank the whole screen. */
  submitting: boolean
  error: string | null
  verifyStatus: RequestStatus
  verifyMessage: string | null
}

const initialState: AuthState = {
  user: null,
  token: loadStoredToken(),
  status: STATUS.idle,
  submitting: false,
  error: null,
  verifyStatus: STATUS.idle,
  verifyMessage: null,
}

export const login = createAsyncThunk(`${SLICE.auth}/login`, async (payload: LoginRequest) => {
  const response = await authApi.login(payload)
  return response.data
})

export const register = createAsyncThunk(
  `${SLICE.auth}/register`,
  async (payload: RegisterRequest) => {
    const response = await authApi.register(payload)
    return response.data
  },
)

/** Restores the session on reload by trading the stored token for its user. */
export const fetchMe = createAsyncThunk(`${SLICE.auth}/me`, async () => {
  const response = await authApi.me()
  return response.data
})

/** The state this thunk inspects, spelled out here so the slice does not have
 *  to import RootState from the store that imports it. */
type StateWithAuth = { [SLICE.auth]: AuthState }

export const verifyEmail = createAsyncThunk(
  `${SLICE.auth}/verify`,
  async (token: string) => {
    const response = await authApi.verify(token)
    return response.data.message
  },
  {
    /**
     * The link is single use: the API clears the token as it verifies, so a
     * second call for the same token is a genuine 400 and would overwrite the
     * success already on screen with a failure.
     *
     * React's StrictMode runs effects twice in development, which is exactly
     * how the bug showed up — one 200 followed by one 400, same token. Guarding
     * here rather than in the component also covers a double click and a
     * re-render, which are the production versions of the same race.
     */
    condition: (_token, { getState }) => {
      const { verifyStatus } = (getState() as StateWithAuth)[SLICE.auth]
      return verifyStatus !== STATUS.loading && verifyStatus !== STATUS.succeeded
    },
  },
)

const authSlice = createSlice({
  name: SLICE.auth,
  initialState,
  reducers: {
    logout: (state) => {
      setAuthToken(null)
      state.user = null
      state.token = null
      state.status = STATUS.idle
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.submitting = true
          state.error = null
        })
        .addCase(thunk.fulfilled, (state, action) => {
          setAuthToken(action.payload.access_token)
          state.submitting = false
          state.status = STATUS.succeeded
          state.token = action.payload.access_token
          state.user = action.payload.user
        })
        .addCase(thunk.rejected, (state, action) => {
          state.submitting = false
          state.error = action.error.message ?? STRINGS.errors.generic
        })
    }

    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = STATUS.loading
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = STATUS.succeeded
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state) => {
        // A stored token that no longer resolves is a signed-out session.
        setAuthToken(null)
        state.status = STATUS.failed
        state.user = null
        state.token = null
      })
      .addCase(verifyEmail.pending, (state) => {
        state.verifyStatus = STATUS.loading
        state.verifyMessage = null
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.verifyStatus = STATUS.succeeded
        state.verifyMessage = action.payload
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.verifyStatus = STATUS.failed
        state.verifyMessage = action.error.message ?? STRINGS.errors.generic
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
