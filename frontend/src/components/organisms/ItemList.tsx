import { useEffect } from 'react'

import { SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { deleteItem, fetchItems } from '../../store/slices/itemsSlice'
import { Button, Spinner, Text } from '../atoms'
import { ItemRow } from '../molecules'

export function ItemList() {
  const dispatch = useAppDispatch()
  const { entities, status, error } = useAppSelector((state) => state[SLICE.items])

  useEffect(() => {
    void dispatch(fetchItems())
  }, [dispatch])

  if (status === STATUS.loading) {
    return <Spinner label={STRINGS.items.loading} />
  }

  if (status === STATUS.failed) {
    return (
      <div>
        <Text tone="danger">{error ?? STRINGS.errors.generic}</Text>
        <Button onClick={() => void dispatch(fetchItems())}>{STRINGS.items.retryAction}</Button>
      </div>
    )
  }

  if (entities.length === 0) {
    return <Text tone="muted">{STRINGS.items.empty}</Text>
  }

  return (
    <ul>
      {entities.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          deleteLabel={STRINGS.items.deleteAction}
          onDelete={(id) => void dispatch(deleteItem(id))}
        />
      ))}
    </ul>
  )
}
