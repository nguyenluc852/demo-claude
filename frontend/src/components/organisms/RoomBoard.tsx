import { useEffect, useState } from 'react'

import { ROOM_STATUS, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchRoomGrid } from '../../store/slices/roomsSlice'
import type { RoomGridItem } from '../../types/models'
import { formatDate, formatMoney } from '../../utils/format'
import { roomStatusLabel, roomStatusTone, roomTypeLabel } from '../../utils/labels'
import { Spinner } from '../atoms'
import { EmptyState, Modal, RoomTile, StatusBadge } from '../molecules'

const LEGEND = [
  ROOM_STATUS.available,
  ROOM_STATUS.occupied,
  ROOM_STATUS.maintenance,
  ROOM_STATUS.overdue,
] as const

export function RoomBoard() {
  const dispatch = useAppDispatch()
  const { grid, gridStatus } = useAppSelector((state) => state[SLICE.rooms])
  const [selected, setSelected] = useState<RoomGridItem | null>(null)

  useEffect(() => {
    void dispatch(fetchRoomGrid())
  }, [dispatch])

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.dashboard.gridHeading}</h2>
        <div className="legend">
          {LEGEND.map((status) => (
            <StatusBadge
              key={status}
              label={roomStatusLabel(status)}
              tone={roomStatusTone(status)}
            />
          ))}
        </div>
      </div>

      {gridStatus === STATUS.loading ? <Spinner label={STRINGS.common.loading} /> : null}

      {gridStatus === STATUS.succeeded && grid.length === 0 ? (
        <EmptyState message={STRINGS.dashboard.gridEmpty} />
      ) : (
        <div className="room-board">
          {grid.map((room) => (
            <RoomTile key={room.id} room={room} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected ? (
        <Modal
          title={`${STRINGS.room.numberLabel} ${selected.room_number}`}
          onClose={() => setSelected(null)}
        >
          <div className="field-row">
            <div className="field">
              <span>{STRINGS.room.statusLabel}</span>
              <StatusBadge
                label={roomStatusLabel(selected.status)}
                tone={roomStatusTone(selected.status)}
              />
            </div>
            <div className="field">
              <span>{STRINGS.dashboard.tenantLabel}</span>
              <strong>{selected.occupancy.tenant_name ?? STRINGS.dashboard.vacant}</strong>
            </div>
            <div className="field">
              <span>{STRINGS.dashboard.contractEndLabel}</span>
              <strong className="num">{formatDate(selected.occupancy.contract_end)}</strong>
            </div>
            <div className="field">
              <span>{STRINGS.room.typeLabel}</span>
              <strong>{roomTypeLabel(selected.room_type)}</strong>
            </div>
            <div className="field">
              <span>{STRINGS.room.areaLabel}</span>
              <strong className="num">
                {selected.area} {STRINGS.room.areaUnit}
              </strong>
            </div>
            <div className="field">
              <span>{STRINGS.room.priceLabel}</span>
              <strong className="num">{formatMoney(selected.base_price)}</strong>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}
