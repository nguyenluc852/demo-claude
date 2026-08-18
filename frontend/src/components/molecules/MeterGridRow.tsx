import { STRINGS } from '../../constants'
import type { MeterRow } from '../../types/models'
import { formatNumber } from '../../utils/format'
import { Button, Input } from '../atoms'
import { StatusBadge } from './StatusBadge'

interface MeterGridRowProps {
  row: MeterRow
  electric: string
  water: string
  saving: boolean
  saved: boolean
  onElectricChange: (value: string) => void
  onWaterChange: (value: string) => void
  onSave: () => void
}

function usage(current: string, previous: number): string {
  const parsed = Number(current)
  if (current === '' || Number.isNaN(parsed)) {
    return STRINGS.common.unknown
  }
  return formatNumber(parsed - previous)
}

/**
 * One room, both meters side by side. Inputs and the save button all disable
 * together while the row's request is in flight, so a double click cannot post
 * the same reading twice.
 */
export function MeterGridRow({
  row,
  electric,
  water,
  saving,
  saved,
  onElectricChange,
  onWaterChange,
  onSave,
}: MeterGridRowProps) {
  return (
    <tr>
      <td>
        <strong className="num">{row.room_number}</strong>
      </td>
      <td>{row.tenant_name ?? STRINGS.common.unknown}</td>
      <td>
        <div className="meter-pair">
          <span className="meter-old">
            {STRINGS.meter.oldLabel} {formatNumber(row.electric_old)}
          </span>
          <Input
            className="meter-input num"
            type="number"
            min={row.electric_old}
            value={electric}
            disabled={saving}
            aria-label={`${STRINGS.meter.columnElectric} ${row.room_number}`}
            onChange={(event) => onElectricChange(event.target.value)}
          />
          <span className="meter-old">{usage(electric, row.electric_old)}</span>
        </div>
      </td>
      <td>
        <div className="meter-pair">
          <span className="meter-old">
            {STRINGS.meter.oldLabel} {formatNumber(row.water_old)}
          </span>
          <Input
            className="meter-input num"
            type="number"
            min={row.water_old}
            value={water}
            disabled={saving}
            aria-label={`${STRINGS.meter.columnWater} ${row.room_number}`}
            onChange={(event) => onWaterChange(event.target.value)}
          />
          <span className="meter-old">{usage(water, row.water_old)}</span>
        </div>
      </td>
      <td>
        {row.invoice_id ? (
          <StatusBadge label={STRINGS.meter.invoiceCreated} tone="positive" />
        ) : saved ? (
          <StatusBadge label={STRINGS.meter.savedLabel} tone="neutral" />
        ) : null}
      </td>
      <td>
        <div className="row-actions">
          <Button
            size="sm"
            variant="primary"
            loading={saving}
            loadingLabel={STRINGS.common.saving}
            onClick={onSave}
          >
            {STRINGS.meter.saveAction}
          </Button>
        </div>
      </td>
    </tr>
  )
}
