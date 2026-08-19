import { STRINGS } from '../../constants'
import { ROOM_STATUS_OPTIONS, ROOM_TYPE_OPTIONS } from '../../utils/labels'
import { SelectField } from './SelectField'

interface RoomFilterBarProps {
  roomType: string
  status: string
  /** How many rooms survive the current filter, shown next to the controls. */
  count: number
  onRoomTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function RoomFilterBar({
  roomType,
  status,
  count,
  onRoomTypeChange,
  onStatusChange,
}: RoomFilterBarProps) {
  return (
    <div className="room-filter-bar">
      <SelectField
        label={STRINGS.home.filterTypeLabel}
        name="room-filter-type"
        value={roomType}
        options={ROOM_TYPE_OPTIONS}
        placeholder={STRINGS.common.all}
        onChange={onRoomTypeChange}
      />
      <SelectField
        label={STRINGS.home.filterStatusLabel}
        name="room-filter-status"
        value={status}
        options={ROOM_STATUS_OPTIONS}
        placeholder={STRINGS.common.all}
        onChange={onStatusChange}
      />
      <p className="room-filter-count">
        <strong className="num">{count}</strong> {STRINGS.home.filterCount}
      </p>
    </div>
  )
}
