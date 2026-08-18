import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { ROOM_STATUS, ROOM_TYPE, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { createRoom, deleteRoom, fetchRooms, updateRoom } from '../../store/slices/roomsSlice'
import type { Room, RoomInput } from '../../types/models'
import { formatMoney } from '../../utils/format'
import {
  ROOM_STATUS_OPTIONS,
  ROOM_TYPE_OPTIONS,
  roomStatusLabel,
  roomStatusTone,
  roomTypeLabel,
} from '../../utils/labels'
import { Button, Input, Spinner } from '../atoms'
import {
  EmptyState,
  FormField,
  Modal,
  Notice,
  SelectField,
  StatusBadge,
  TextareaField,
  ThumbList,
} from '../molecules'

/** Quick-insert stock photography, so a room is never listed without a picture. */
const SUGGESTED_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200',
] as const

const EMPTY_FORM: RoomInput = {
  room_number: '',
  floor: 1,
  room_type: ROOM_TYPE.studio,
  area: 20,
  base_price: 3_000_000,
  amenities: [],
  images: [],
  description: '',
  status: ROOM_STATUS.available,
}

const AMENITY_SEPARATOR = ','

function toForm(room: Room): RoomInput {
  return {
    room_number: room.room_number,
    floor: room.floor,
    room_type: room.room_type,
    area: room.area,
    base_price: room.base_price,
    amenities: room.amenities,
    images: room.images,
    description: room.description ?? '',
    status: room.status,
  }
}

export function RoomManager() {
  const dispatch = useAppDispatch()
  const { entities, status, submitting, error } = useAppSelector((state) => state[SLICE.rooms])

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Room | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<RoomInput>(EMPTY_FORM)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    void dispatch(fetchRooms(search || undefined))
  }, [dispatch, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImageUrl('')
    setOpen(true)
  }

  function openEdit(room: Room) {
    setEditing(room)
    setForm(toForm(room))
    setImageUrl('')
    setOpen(true)
  }

  function update<K extends keyof RoomInput>(field: K, value: RoomInput[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function addImage(url: string) {
    const trimmed = url.trim()
    if (!trimmed || form.images.includes(trimmed)) {
      return
    }
    update('images', [...form.images, trimmed])
    setImageUrl('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = editing
      ? await dispatch(updateRoom({ id: editing.id, payload: form }))
      : await dispatch(createRoom(form))

    const succeeded = editing
      ? updateRoom.fulfilled.match(result)
      : createRoom.fulfilled.match(result)
    if (succeeded) {
      setOpen(false)
    }
  }

  async function onDelete(room: Room) {
    if (window.confirm(STRINGS.room.deleteConfirm)) {
      await dispatch(deleteRoom(room.id))
    }
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.room.heading}</h2>
        <div className="toolbar">
          <Input
            value={search}
            placeholder={STRINGS.room.searchPlaceholder}
            aria-label={STRINGS.common.search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="accent" onClick={openCreate}>
            {STRINGS.room.addAction}
          </Button>
        </div>
      </div>

      {error && !open ? <Notice message={error} tone="danger" /> : null}
      {status === STATUS.loading ? <Spinner label={STRINGS.common.loading} /> : null}

      {status === STATUS.succeeded && entities.length === 0 ? (
        <EmptyState message={STRINGS.room.empty} />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{STRINGS.room.numberLabel}</th>
                <th>{STRINGS.room.floorLabel}</th>
                <th>{STRINGS.room.typeLabel}</th>
                <th className="num">{STRINGS.room.areaLabel}</th>
                <th className="num">{STRINGS.room.priceLabel}</th>
                <th>{STRINGS.room.statusLabel}</th>
                <th>{STRINGS.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((room) => (
                <tr key={room.id}>
                  <td>
                    <strong className="num">{room.room_number}</strong>
                  </td>
                  <td className="num">{room.floor}</td>
                  <td>{roomTypeLabel(room.room_type)}</td>
                  <td className="num">
                    {room.area} {STRINGS.room.areaUnit}
                  </td>
                  <td className="num">{formatMoney(room.base_price)}</td>
                  <td>
                    <StatusBadge
                      label={roomStatusLabel(room.status)}
                      tone={roomStatusTone(room.status)}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(room)}>
                        {STRINGS.common.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={submitting}
                        onClick={() => void onDelete(room)}
                      >
                        {STRINGS.common.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <Modal
          title={editing ? STRINGS.room.editAction : STRINGS.room.addAction}
          onClose={() => setOpen(false)}
          busy={submitting}
          footer={
            <>
              <Button variant="secondary" disabled={submitting} onClick={() => setOpen(false)}>
                {STRINGS.common.cancel}
              </Button>
              <Button
                type="submit"
                form="room-form"
                variant="primary"
                loading={submitting}
                loadingLabel={STRINGS.common.saving}
              >
                {STRINGS.common.save}
              </Button>
            </>
          }
        >
          <form id="room-form" className="stack" onSubmit={onSubmit}>
            <div className="field-row">
              <FormField
                label={STRINGS.room.numberLabel}
                name="room_number"
                value={form.room_number}
                required
                onChange={(event) => update('room_number', event.target.value)}
              />
              <FormField
                label={STRINGS.room.floorLabel}
                name="floor"
                type="number"
                value={form.floor}
                required
                onChange={(event) => update('floor', Number(event.target.value))}
              />
              <SelectField
                label={STRINGS.room.typeLabel}
                name="room_type"
                value={form.room_type}
                options={ROOM_TYPE_OPTIONS}
                onChange={(value) => update('room_type', value)}
              />
              <SelectField
                label={STRINGS.room.statusLabel}
                name="status"
                value={form.status ?? ROOM_STATUS.available}
                options={ROOM_STATUS_OPTIONS}
                onChange={(value) => update('status', value)}
              />
              <FormField
                label={`${STRINGS.room.areaLabel} (${STRINGS.room.areaUnit})`}
                name="area"
                type="number"
                step="0.1"
                value={form.area}
                required
                onChange={(event) => update('area', Number(event.target.value))}
              />
              <FormField
                label={STRINGS.room.priceLabel}
                name="base_price"
                type="number"
                value={form.base_price}
                required
                onChange={(event) => update('base_price', Number(event.target.value))}
              />
            </div>

            <FormField
              label={STRINGS.room.amenitiesLabel}
              name="amenities"
              value={form.amenities.join(`${AMENITY_SEPARATOR} `)}
              onChange={(event) =>
                update(
                  'amenities',
                  event.target.value
                    .split(AMENITY_SEPARATOR)
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                )
              }
            />

            <TextareaField
              label={STRINGS.room.descriptionLabel}
              name="description"
              value={form.description ?? ''}
              onChange={(event) => update('description', event.target.value)}
            />

            <div className="field">
              <span>{STRINGS.room.imagesLabel}</span>
              <div className="toolbar">
                <Input
                  value={imageUrl}
                  placeholder={STRINGS.room.imageUrlPlaceholder}
                  aria-label={STRINGS.room.imagesLabel}
                  onChange={(event) => setImageUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      // The gallery input sits inside the room form; Enter must
                      // add an image, not submit the whole modal.
                      event.preventDefault()
                      addImage(imageUrl)
                    }
                  }}
                />
                <Button variant="secondary" onClick={() => addImage(imageUrl)}>
                  {STRINGS.room.addImage}
                </Button>
              </div>

              <div className="toolbar">
                <span className="stat-label">{STRINGS.room.suggestedImages}</span>
                {SUGGESTED_IMAGES.map((url, index) => (
                  <Button
                    key={url}
                    size="sm"
                    variant="ghost"
                    onClick={() => addImage(url)}
                  >
                    #{index + 1}
                  </Button>
                ))}
              </div>

              <ThumbList
                images={form.images}
                disabled={submitting}
                onRemove={(url) =>
                  update(
                    'images',
                    form.images.filter((image) => image !== url),
                  )
                }
              />
            </div>

            {error ? <Notice message={error} tone="danger" /> : null}
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
