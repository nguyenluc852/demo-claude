import type { Item } from '../../types/models'
import { Button, Text } from '../atoms'

interface ItemRowProps {
  item: Item
  deleteLabel: string
  onDelete: (id: number) => void
}

export function ItemRow({ item, deleteLabel, onDelete }: ItemRowProps) {
  return (
    <li>
      <Text>{item.name}</Text>
      {item.description ? <Text tone="muted">{item.description}</Text> : null}
      <Button onClick={() => onDelete(item.id)}>{deleteLabel}</Button>
    </li>
  )
}
