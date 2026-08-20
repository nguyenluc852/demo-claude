import { afterEach, describe, expect, it, vi } from 'vitest'

import { API_PREFIX, API_ROUTES, ERROR_CODE, SLICE, STATUS } from '../../constants'
import { makeStore } from '../../test/utils'
import { verifyEmail } from './authSlice'

afterEach(() => vi.unstubAllGlobals())

const TOKEN = 'verify-token-1'

/** Copy the API returns, not copy the frontend owns — the panel renders whatever
 *  `messages.py` sent, so the test pins the plumbing rather than the wording. */
const VERIFIED_MESSAGE = 'Email đã được xác minh.'
const USED_LINK_MESSAGE = 'Liên kết xác minh không hợp lệ hoặc đã được dùng.'

function okFetch() {
  return vi.fn().mockResolvedValue(Response.json({ data: { message: VERIFIED_MESSAGE } }))
}

function usedLinkFetch() {
  return vi.fn().mockResolvedValue(
    Response.json(
      { error: { code: ERROR_CODE.badRequest, message: USED_LINK_MESSAGE } },
      { status: 400 },
    ),
  )
}

describe('authSlice verifyEmail', () => {
  it('sends the single-use token once even when the effect runs twice', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)
    const store = makeStore()

    await store.dispatch(verifyEmail(TOKEN))
    await store.dispatch(verifyEmail(TOKEN))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain(`${API_PREFIX}${API_ROUTES.authVerify}`)

    const state = store.getState()[SLICE.auth]
    expect(state.verifyStatus).toBe(STATUS.succeeded)
    expect(state.verifyMessage).toBe(VERIFIED_MESSAGE)
  })

  it('collapses a second dispatch that starts while the first is still in flight', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)
    const store = makeStore()

    // Both dispatched before either resolves — the StrictMode double effect.
    const first = store.dispatch(verifyEmail(TOKEN))
    const second = store.dispatch(verifyEmail(TOKEN))
    await Promise.all([first, second])

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const state = store.getState()[SLICE.auth]
    expect(state.verifyStatus).toBe(STATUS.succeeded)
    expect(state.verifyMessage).toBe(VERIFIED_MESSAGE)
  })

  it('keeps the success on screen when the verified page is reloaded', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)
    const store = makeStore()
    await store.dispatch(verifyEmail(TOKEN))

    await store.dispatch(verifyEmail(TOKEN))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const state = store.getState()[SLICE.auth]
    expect(state.verifyStatus).not.toBe(STATUS.failed)
    expect(state.verifyStatus).toBe(STATUS.succeeded)
    expect(state.verifyMessage).toBe(VERIFIED_MESSAGE)
  })

  it('still surfaces a genuinely dead link', async () => {
    const fetchMock = usedLinkFetch()
    vi.stubGlobal('fetch', fetchMock)
    const store = makeStore()

    await store.dispatch(verifyEmail(TOKEN))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const state = store.getState()[SLICE.auth]
    expect(state.verifyStatus).toBe(STATUS.failed)
    expect(state.verifyMessage).toBe(USED_LINK_MESSAGE)
  })
})
