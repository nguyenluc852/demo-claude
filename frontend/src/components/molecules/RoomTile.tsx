import { STRINGS } from '../../constants'
import { formatDate } from '../../utils/format'
import type { RoomGridItem } from '../../types/models'

interface RoomTileProps {
  room: RoomGridItem
  onSelect: (room: RoomGridItem) => void
}

/**
 * The dashboard's signature element: one tile per room, colour-coded by status
 * along a spine so a whole property reads in a single glance.
 */
export function RoomTile({ room, onSelect }: RoomTileProps) {
  const { tenant_name: tenant, contract_end: contractEnd } = room.occupancy
  return (
    <button
      type="button"
      className="room-tile"
      data-status={room.status}
      onClick={() => onSelect(room)}
    >
      <span className="room-tile-number">{room.room_number}</span>
      <span className="room-tile-meta">
        {STRINGS.room.floorLabel} {room.floor}
      </span>
      <span className="room-tile-meta">{tenant ?? STRINGS.dashboard.vacant}</span>
      {contractEnd ? (
        <span className="room-tile-meta">
          {STRINGS.dashboard.contractEndLabel}: {formatDate(contractEnd)}
        </span>
      ) : null}
    </button>
  )
}
