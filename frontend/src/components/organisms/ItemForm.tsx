import { useState, type FormEvent } from 'react'

import { STRINGS } from '../../constants'
import { useAppDispatch } from '../../store/hooks'
import { createItem } from '../../store/slices/itemsSlice'
import { Button, Text } from '../atoms'
import { FormField } from '../molecules'

export function ItemForm() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (name.trim() === '') {
      setError(STRINGS.errors.nameRequired)
      return
    }

    setError(null)
    void dispatch(createItem({ name: name.trim(), description: description.trim() || null }))
    setName('')
    setDescription('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label={STRINGS.items.nameLabel}
        name="name"
        placeholder={STRINGS.items.namePlaceholder}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <FormField
        label={STRINGS.items.descriptionLabel}
        name="description"
        placeholder={STRINGS.items.descriptionPlaceholder}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {error ? <Text tone="danger">{error}</Text> : null}
      <Button type="submit">{STRINGS.items.addAction}</Button>
    </form>
  )
}
