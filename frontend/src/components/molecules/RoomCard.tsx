import { STRINGS } from '../../constants'
import type { PublicRoom } from '../../types/models'
import { formatMoney } from '../../utils/format'
import { roomStatusLabel, roomStatusTone, roomTypeLabel } from '../../utils/labels'
import { StatusBadge } from './StatusBadge'

interface RoomCardProps {
  room: PublicRoom
  onSelect: (room: PublicRoom) => void
}

export function RoomCard({ room, onSelect }: RoomCardProps) {
  const cover = room.images.at(0)
  return (
    <button type="button" className="room-card" onClick={() => onSelect(room)}>
      <span className="room-card-media">
        {cover ? <img src={cover} alt={room.room_number} loading="lazy" /> : null}
      </span>
      <span className="room-card-body">
        <span className="room-card-title">
          <span>
            {STRINGS.room.numberLabel} {room.room_number}
          </span>
          <StatusBadge label={roomStatusLabel(room.status)} tone={roomStatusTone(room.status)} />
        </span>
        <span className="room-card-price">
          {formatMoney(room.base_price)}
          {STRINGS.common.perMonth}
        </span>
        <span className="room-card-facts">
          <span>{roomTypeLabel(room.room_type)}</span>
          <span>
            {room.area} {STRINGS.room.areaUnit}
          </span>
          <span>
            {STRINGS.room.floorLabel} {room.floor}
          </span>
        </span>
      </span>
    </button>
  )
}
