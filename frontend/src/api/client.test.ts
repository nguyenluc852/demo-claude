import { afterEach, describe, expect, it, vi } from 'vitest'

import { ERROR_CODE, STRINGS } from '../constants'
import { ApiError, apiClient } from './client'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(response: Response | Promise<never>) {
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(Promise.resolve(response)))
}

describe('apiClient', () => {
  it('returns the parsed envelope on success', async () => {
    stubFetch(Response.json({ data: { status: 'ok' } }))

    await expect(apiClient.get('/health')).resolves.toEqual({ data: { status: 'ok' } })
  })

  it('surfaces the backend error code and message', async () => {
    stubFetch(
      Response.json(
        { error: { code: ERROR_CODE.notFound, message: 'gone' } },
        { status: 404 },
      ),
    )

    await expect(apiClient.get('/items/1')).rejects.toMatchObject({
      code: ERROR_CODE.notFound,
      message: 'gone',
      status: 404,
    })
  })

  it('reports a network failure with the shared message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(apiClient.get('/health')).rejects.toThrow(STRINGS.errors.network)
  })

  it('resolves undefined for a 204 with no body', async () => {
    stubFetch(new Response(null, { status: 204 }))

    await expect(apiClient.delete('/items/1')).resolves.toBeUndefined()
  })

  it('is an ApiError so callers can narrow on it', async () => {
    stubFetch(new Response(null, { status: 500 }))

    await expect(apiClient.get('/health')).rejects.toBeInstanceOf(ApiError)
  })
})
