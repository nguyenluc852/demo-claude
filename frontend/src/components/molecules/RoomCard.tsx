import { STRINGS } from '../../constants'
import type { PublicRoom } from '../../types/models'
import { formatMoney } from '../../utils/format'
import { roomStatusLabel, roomStatusTone, roomTypeLabel } from '../../utils/labels'
import { stagger } from '../../utils/style'
import { Button } from '../atoms'
import { StatusBadge } from './StatusBadge'

/** Amenities beyond this many are left for the detail modal. */
const AMENITY_PREVIEW = 3

interface RoomCardProps {
  room: PublicRoom
  onSelect: (room: PublicRoom) => void
  /** Skips the modal and takes the visitor straight to the booking form. */
  onBook: (room: PublicRoom) => void
  index?: number
}

/**
 * The whole card opens the room, and a second button books it. The card is an
 * `<article>` with an overlay button rather than a `<button>` wrapper, because a
 * button nested inside a button is invalid and the inner one stops responding.
 */
export function RoomCard({ room, onSelect, onBook, index = 0 }: RoomCardProps) {
  const cover = room.images.at(0)
  const preview = room.amenities.slice(0, AMENITY_PREVIEW)

  return (
    <article className="room-card reveal" style={stagger(index)}>
      <button
        type="button"
        className="room-card-hit"
        onClick={() => onSelect(room)}
        aria-label={`${STRINGS.room.detailHeading} ${room.room_number}`}
      />

      <span className="room-card-media">
        {cover ? <img src={cover} alt={room.room_number} loading="lazy" /> : null}
        <span className="room-card-status">
          <StatusBadge label={roomStatusLabel(room.status)} tone={roomStatusTone(room.status)} />
        </span>
      </span>

      <span className="room-card-body">
        <span className="room-card-title">
          {STRINGS.room.numberLabel} {room.room_number}
        </span>
        <span className="room-card-price">
          {formatMoney(room.base_price)}
          {STRINGS.common.perMonth}
        </span>
        <span className="room-card-facts">
          <span>{roomTypeLabel(room.room_type)}</span>
          <span className="num">
            {room.area} {STRINGS.room.areaUnit}
          </span>
          <span>
            {STRINGS.room.floorLabel} <span className="num">{room.floor}</span>
          </span>
        </span>

        {preview.length > 0 ? (
          <span className="room-card-chips">
            {preview.map((amenity) => (
              <span className="chip" key={amenity}>
                {amenity}
              </span>
            ))}
          </span>
        ) : null}

        <span className="room-card-action">
          <Button variant="secondary" size="sm" onClick={() => onBook(room)}>
            {STRINGS.room.bookThisRoom}
          </Button>
        </span>
      </span>
    </article>
  )
}
