import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { STRINGS } from '../../constants'
import { renderWithStore } from '../../test/utils'
import { ItemList } from './ItemList'

afterEach(() => vi.unstubAllGlobals())

function stubItems(items: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({ data: items, meta: { page: 1, size: 20, total: items.length } }),
    ),
  )
}

describe('ItemList', () => {
  it('shows the empty message when the API returns nothing', async () => {
    stubItems([])

    renderWithStore(<ItemList />)

    expect(await screen.findByText(STRINGS.items.empty)).toBeInTheDocument()
  })

  it('renders a row per item', async () => {
    stubItems([{ id: 1, name: 'Widget', description: null }])

    renderWithStore(<ItemList />)

    expect(await screen.findByText('Widget')).toBeInTheDocument()
    expect(screen.getByText(STRINGS.items.deleteAction)).toBeInTheDocument()
  })

  it('offers a retry when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    renderWithStore(<ItemList />)

    expect(await screen.findByText(STRINGS.items.retryAction)).toBeInTheDocument()
  })
})
