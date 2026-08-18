import { useEffect } from 'react'

import { SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchTenantInvoices,
  fetchTenantOverview,
} from '../../store/slices/tenantSlice'
import { formatDate, formatMoney } from '../../utils/format'
import {
  contractStatusLabel,
  contractStatusTone,
  invoiceStatusLabel,
  invoiceStatusTone,
  paymentCycleLabel,
  roomStatusLabel,
  roomStatusTone,
  roomTypeLabel,
} from '../../utils/labels'
import { Spinner, Text } from '../atoms'
import { EmptyState, Notice, StatCard, StatusBadge } from '../molecules'

export function TenantPortal() {
  const dispatch = useAppDispatch()
  const { overview, invoices, status, error } = useAppSelector((state) => state[SLICE.tenant])

  useEffect(() => {
    void dispatch(fetchTenantOverview())
    void dispatch(fetchTenantInvoices())
  }, [dispatch])

  if (status === STATUS.loading || status === STATUS.idle) {
    return <Spinner label={STRINGS.common.loading} />
  }

  if (!overview) {
    return <Notice message={error ?? STRINGS.tenant.noContract} tone="danger" />
  }

  const { contract, room } = overview

  return (
    <div className="stack">
      <section className="card">
        <div className="section-head">
          <h2>{STRINGS.tenant.contractHeading}</h2>
          <StatusBadge
            label={contractStatusLabel(contract.status)}
            tone={contractStatusTone(contract.status)}
          />
        </div>
        <div className="stat-grid">
          <StatCard label={STRINGS.contract.startLabel} value={formatDate(contract.start_date)} />
          <StatCard label={STRINGS.contract.endLabel} value={formatDate(contract.end_date)} />
          <StatCard label={STRINGS.contract.depositLabel} value={formatMoney(contract.deposit)} />
          <StatCard
            label={STRINGS.contract.cycleLabel}
            value={paymentCycleLabel(contract.payment_cycle)}
          />
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>
            {STRINGS.tenant.roomHeading} · {room.room_number}
          </h2>
          <StatusBadge label={roomStatusLabel(room.status)} tone={roomStatusTone(room.status)} />
        </div>
        <div className="stat-grid">
          <StatCard label={STRINGS.room.typeLabel} value={roomTypeLabel(room.room_type)} />
          <StatCard
            label={STRINGS.room.areaLabel}
            value={`${room.area} ${STRINGS.room.areaUnit}`}
          />
          <StatCard label={STRINGS.room.priceLabel} value={formatMoney(room.base_price)} />
          <StatCard label={STRINGS.room.floorLabel} value={String(room.floor)} />
        </div>
        {room.amenities.length > 0 ? (
          <p>
            <Text tone="muted">{room.amenities.join(' · ')}</Text>
          </p>
        ) : null}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>{STRINGS.tenant.invoicesHeading}</h2>
        </div>

        {invoices.length === 0 ? (
          <EmptyState message={STRINGS.tenant.invoicesEmpty} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{STRINGS.invoice.columnPeriod}</th>
                  <th className="num">{STRINGS.meter.columnElectric}</th>
                  <th className="num">{STRINGS.meter.columnWater}</th>
                  <th className="num">{STRINGS.invoice.columnTotal}</th>
                  <th className="num">{STRINGS.invoice.columnPaid}</th>
                  <th>{STRINGS.invoice.columnStatus}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const electric = invoice.lines.find((line) => line.meter_new !== null)
                  const water = invoice.lines.filter((line) => line.meter_new !== null).at(1)
                  return (
                    <tr key={invoice.id}>
                      <td className="num">{invoice.period}</td>
                      <td className="num">
                        {electric
                          ? `${electric.meter_old} → ${electric.meter_new}`
                          : STRINGS.common.unknown}
                      </td>
                      <td className="num">
                        {water
                          ? `${water.meter_old} → ${water.meter_new}`
                          : STRINGS.common.unknown}
                      </td>
                      <td className="num">{formatMoney(invoice.total)}</td>
                      <td className="num">{formatMoney(invoice.paid_amount)}</td>
                      <td>
                        <StatusBadge
                          label={invoiceStatusLabel(invoice.status)}
                          tone={invoiceStatusTone(invoice.status)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
