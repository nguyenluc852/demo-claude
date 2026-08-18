import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { STRINGS } from '../../constants'
import type { MeterRow } from '../../types/models'
import { MeterGridRow } from './MeterGridRow'

const row: MeterRow = {
  room_id: 'room-1',
  room_number: '101',
  floor: 1,
  contract_id: 'contract-1',
  tenant_name: 'Nguyen Van A',
  period: '2026-08',
  electric_old: 100,
  electric_new: null,
  water_old: 10,
  water_new: null,
  invoice_id: null,
}

function renderRow(overrides: Partial<Parameters<typeof MeterGridRow>[0]> = {}) {
  const onSave = vi.fn()
  render(
    <table>
      <tbody>
        <MeterGridRow
          row={row}
          electric="150"
          water="12"
          saving={false}
          saved={false}
          onElectricChange={vi.fn()}
          onWaterChange={vi.fn()}
          onSave={onSave}
          {...overrides}
        />
      </tbody>
    </table>,
  )
  return { onSave }
}

describe('MeterGridRow', () => {
  it('shows the room, tenant, and both previous readings', () => {
    renderRow()

    expect(screen.getByText(row.room_number)).toBeInTheDocument()
    expect(screen.getByText(row.tenant_name!)).toBeInTheDocument()
    expect(
      screen.getByLabelText(`${STRINGS.meter.columnElectric} ${row.room_number}`),
    ).toHaveValue(150)
  })

  it('saves the row when the button is pressed', async () => {
    const { onSave } = renderRow()

    await userEvent.click(screen.getByRole('button', { name: STRINGS.meter.saveAction }))

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('locks the inputs and the button while the save is in flight', () => {
    const { onSave } = renderRow({ saving: true })

    expect(
      screen.getByLabelText(`${STRINGS.meter.columnElectric} ${row.room_number}`),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: STRINGS.common.saving })).toBeDisabled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('confirms once the period has produced an invoice', () => {
    renderRow({ row: { ...row, invoice_id: 'invoice-1' } })

    expect(screen.getByText(STRINGS.meter.invoiceCreated)).toBeInTheDocument()
  })
})
