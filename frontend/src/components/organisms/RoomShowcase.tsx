import { useEffect, useState } from 'react'

import { CONTACT_FORM_ANCHOR, ROOMS_ANCHOR, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchPublicRooms } from '../../store/slices/publicSlice'
import type { PublicRoom } from '../../types/models'
import { formatMoney } from '../../utils/format'
import { roomStatusLabel, roomStatusTone, roomTypeLabel } from '../../utils/labels'
import { Button, Spinner, Text } from '../atoms'
import { EmptyState, ImageGallery, Modal, RoomCard, StatusBadge } from '../molecules'

interface RoomShowcaseProps {
  /** Called when a visitor asks to view a room, so the form can pre-fill. */
  onBookRoom: (room: PublicRoom) => void
}

export function RoomShowcase({ onBookRoom }: RoomShowcaseProps) {
  const dispatch = useAppDispatch()
  const { rooms, status } = useAppSelector((state) => state[SLICE.publicSite])
  const [selected, setSelected] = useState<PublicRoom | null>(null)

  useEffect(() => {
    void dispatch(fetchPublicRooms())
  }, [dispatch])

  function book(room: PublicRoom) {
    onBookRoom(room)
    setSelected(null)
    document.getElementById(CONTACT_FORM_ANCHOR)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="site-section" id={ROOMS_ANCHOR}>
      <div className="site-wrap">
        <h2>{STRINGS.home.roomsHeading}</h2>
        <p>{STRINGS.home.roomsBody}</p>

        {status === STATUS.loading ? <Spinner label={STRINGS.common.loading} /> : null}

        {status === STATUS.succeeded && rooms.length === 0 ? (
          <EmptyState message={STRINGS.home.roomsEmpty} />
        ) : null}

        <div className="room-cards">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onSelect={setSelected} />
          ))}
        </div>
      </div>

      {selected ? (
        <Modal
          title={`${STRINGS.room.detailHeading} ${selected.room_number}`}
          onClose={() => setSelected(null)}
          footer={
            <Button variant="accent" onClick={() => book(selected)}>
              {STRINGS.room.bookThisRoom}
            </Button>
          }
        >
          <ImageGallery images={selected.images} alt={selected.room_number} />
          <div className="field-row">
            <div className="field">
              <span>{STRINGS.room.priceLabel}</span>
              <strong className="num">
                {formatMoney(selected.base_price)}
                {STRINGS.common.perMonth}
              </strong>
            </div>
            <div className="field">
              <span>{STRINGS.room.areaLabel}</span>
              <strong className="num">
                {selected.area} {STRINGS.room.areaUnit}
              </strong>
            </div>
            <div className="field">
              <span>{STRINGS.room.typeLabel}</span>
              <strong>{roomTypeLabel(selected.room_type)}</strong>
            </div>
            <div className="field">
              <span>{STRINGS.room.floorLabel}</span>
              <strong className="num">{selected.floor}</strong>
            </div>
            <div className="field">
              <span>{STRINGS.room.statusLabel}</span>
              <StatusBadge
                label={roomStatusLabel(selected.status)}
                tone={roomStatusTone(selected.status)}
              />
            </div>
          </div>

          {selected.amenities.length > 0 ? (
            <div className="field">
              <span>{STRINGS.room.amenitiesLabel}</span>
              <Text>{selected.amenities.join(' · ')}</Text>
            </div>
          ) : null}

          {selected.description ? (
            <div className="field">
              <span>{STRINGS.room.descriptionLabel}</span>
              <Text>{selected.description}</Text>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </section>
  )
}
