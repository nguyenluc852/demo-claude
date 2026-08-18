import { describe, expect, it } from 'vitest'

import { SLICE, STATUS } from '../../constants'
import type { Item } from '../../types/models'
import { makeStore } from '../../test/utils'
import { createItem, deleteItem, fetchItems } from './itemsSlice'

const ITEM: Item = { id: 1, name: 'Widget', description: null }


describe('itemsSlice', () => {
  it('starts idle and empty', () => {
    const state = makeStore().getState()[SLICE.items]

    expect(state.status).toBe(STATUS.idle)
    expect(state.entities).toEqual([])
  })

  it('stores entities and total from a fulfilled fetch', () => {
    const store = makeStore()

    store.dispatch({
      type: fetchItems.fulfilled.type,
      payload: { data: [ITEM], meta: { page: 1, size: 20, total: 1 } },
    })

    const state = store.getState()[SLICE.items]
    expect(state.entities).toEqual([ITEM])
    expect(state.total).toBe(1)
    expect(state.status).toBe(STATUS.succeeded)
  })

  it('appends a created item and bumps the total', () => {
    const store = makeStore()

    store.dispatch({ type: createItem.fulfilled.type, payload: ITEM })

    const state = store.getState()[SLICE.items]
    expect(state.entities).toEqual([ITEM])
    expect(state.total).toBe(1)
  })

  it('removes a deleted item by id', () => {
    const store = makeStore()
    store.dispatch({ type: createItem.fulfilled.type, payload: ITEM })

    store.dispatch({ type: deleteItem.fulfilled.type, payload: ITEM.id })

    expect(store.getState()[SLICE.items].entities).toEqual([])
  })

  it('records an error message when the fetch rejects', () => {
    const store = makeStore()

    store.dispatch({ type: fetchItems.rejected.type, error: { message: 'boom' } })

    const state = store.getState()[SLICE.items]
    expect(state.status).toBe(STATUS.failed)
    expect(state.error).toBe('boom')
  })
})
