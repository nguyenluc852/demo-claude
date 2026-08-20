import { STRINGS } from '../../constants'
import type { Invoice } from '../../types/models'
import { formatMoney, formatNumber } from '../../utils/format'
import { serviceUnitLabel } from '../../utils/labels'

interface InvoiceLineTableProps {
  invoice: Invoice
}

/**
 * What an invoice is made of, identical for staff and for the tenant: the rent
 * line the invoice always carries, then each snapshotted charge.
 *
 * The totals block is deliberately *not* here — the two screens summarise
 * different things (staff care when it was sent, the tenant cares what is still
 * owed), and folding both into one component would mean a props flag choosing
 * between two layouts.
 */
export function InvoiceLineTable({ invoice }: InvoiceLineTableProps) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{STRINGS.invoice.lineDescription}</th>
            <th className="num">{STRINGS.invoice.lineOld}</th>
            <th className="num">{STRINGS.invoice.lineNew}</th>
            <th className="num">{STRINGS.invoice.lineUsage}</th>
            <th className="num">{STRINGS.invoice.lineUnitPrice}</th>
            <th className="num">{STRINGS.invoice.lineAmount}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{STRINGS.invoice.rentLine}</td>
            <td className="num">{STRINGS.common.unknown}</td>
            <td className="num">{STRINGS.common.unknown}</td>
            <td className="num">{RENT_QUANTITY}</td>
            <td className="num">{formatMoney(invoice.room_charge)}</td>
            <td className="num">{formatMoney(invoice.room_charge)}</td>
          </tr>
          {invoice.lines.map((line) => (
            <tr key={line.code}>
              <td>
                {line.name}
                <br />
                <span data-tone="muted">{serviceUnitLabel(line.unit)}</span>
              </td>
              <td className="num">{formatNumber(line.meter_old)}</td>
              <td className="num">{formatNumber(line.meter_new)}</td>
              <td className="num">{formatNumber(line.quantity)}</td>
              <td className="num">{formatMoney(line.unit_price)}</td>
              <td className="num">{formatMoney(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Rent is charged once per invoice; it has no meter and no multiplier. */
const RENT_QUANTITY = 1
