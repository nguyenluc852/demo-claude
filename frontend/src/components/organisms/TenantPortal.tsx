import { useEffect, useMemo, useState } from 'react'

import { SERVICE_CODE, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchTenantInvoices,
  fetchTenantOverview,
} from '../../store/slices/tenantSlice'
import type { Invoice, InvoiceLine } from '../../types/models'
import { formatDate, formatMoney, formatNumber } from '../../utils/format'
import { invoiceStatusLabel, invoiceStatusTone } from '../../utils/labels'
import { Button, Spinner, Text } from '../atoms'
import {
  EmptyState,
  InvoiceLineTable,
  Modal,
  Notice,
  StatCard,
  StatusBadge,
  Tabs,
  UsageChart,
} from '../molecules'
import type { UsagePoint } from '../molecules'

/* The two series read their colour from the palette rather than carrying a hex:
   the accent for electricity, the support green for water. */
const COLOR_ELECTRIC = 'var(--orange-600)'
const COLOR_WATER = 'var(--sage-600)'

const SERIES_OPTIONS = [
  [SERVICE_CODE.electricity, STRINGS.meter.columnElectric],
  [SERVICE_CODE.water, STRINGS.meter.columnWater],
] as const

/** Finds a charge by its service code — never by position in the line list. */
function lineFor(invoice: Invoice, code: string): InvoiceLine | undefined {
  return invoice.lines.find((line) => line.code === code)
}

/** Oldest period first, so the chart reads left to right in time. */
function usagePoints(invoices: readonly Invoice[], code: string): UsagePoint[] {
  return invoices
    .filter((invoice) => lineFor(invoice, code) !== undefined)
    .map((invoice) => ({ period: invoice.period, usage: lineFor(invoice, code)!.quantity }))
    .reverse()
}

export function TenantPortal() {
  const dispatch = useAppDispatch()
  const { overview, invoices, status, error } = useAppSelector((state) => state[SLICE.tenant])
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [series, setSeries] = useState<string>(SERVICE_CODE.electricity)

  useEffect(() => {
    void dispatch(fetchTenantOverview())
    void dispatch(fetchTenantInvoices())
  }, [dispatch])

  const points = useMemo(() => usagePoints(invoices, series), [invoices, series])

  const summary = useMemo(() => {
    if (points.length === 0) {
      return null
    }
    const total = points.reduce((sum, point) => sum + point.usage, 0)
    return { average: total / points.length, latest: points[points.length - 1]!.usage }
  }, [points])

  if (status === STATUS.loading || status === STATUS.idle) {
    return <Spinner label={STRINGS.common.loading} />
  }

  if (!overview) {
    return <Notice message={error ?? STRINGS.tenant.noContract} tone="danger" />
  }

  const seriesLabel =
    series === SERVICE_CODE.water ? STRINGS.meter.columnWater : STRINGS.meter.columnElectric

  const { balance } = overview

  return (
    <div className="stack">
      <section className="card">
        <div className="section-head">
          <h2>{STRINGS.tenant.balanceHeading}</h2>
        </div>

        {balance.outstanding === 0 ? (
          <Notice message={STRINGS.tenant.balanceSettled} tone="success" />
        ) : (
          <>
            <div className="stat-grid">
              <StatCard
                label={STRINGS.tenant.balanceOutstanding}
                value={formatMoney(balance.outstanding)}
              />
              <StatCard
                label={
                  balance.current_period
                    ? `${STRINGS.tenant.balanceCurrent} · ${balance.current_period}`
                    : STRINGS.tenant.balanceCurrent
                }
                value={formatMoney(balance.current_due)}
              />
              <StatCard
                label={STRINGS.tenant.balancePrevious}
                value={formatMoney(balance.previous_due)}
              />
              <StatCard
                label={STRINGS.tenant.balanceDueDate}
                value={formatDate(balance.due_date)}
              />
            </div>
            {balance.previous_due > 0 ? (
              <p>
                <Text tone="muted">{STRINGS.tenant.balanceCarryOver}</Text>
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>{STRINGS.tenant.usageHeading}</h2>
          <Tabs
            label={STRINGS.tenant.usageHeading}
            value={series}
            options={SERIES_OPTIONS}
            onChange={setSeries}
          />
        </div>

        {summary ? (
          <div className="stat-grid">
            <StatCard
              label={`${STRINGS.tenant.usageLatest} · ${seriesLabel}`}
              value={formatNumber(summary.latest)}
            />
            <StatCard
              label={`${STRINGS.tenant.usageAverage} · ${seriesLabel}`}
              value={formatNumber(summary.average)}
            />
          </div>
        ) : null}

        <UsageChart
          points={points}
          label={seriesLabel}
          color={series === SERVICE_CODE.water ? COLOR_WATER : COLOR_ELECTRIC}
        />
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
                  <th>{STRINGS.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const electric = lineFor(invoice, SERVICE_CODE.electricity)
                  const water = lineFor(invoice, SERVICE_CODE.water)
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
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`${STRINGS.tenant.invoiceDetailAction} ${invoice.period}`}
                          onClick={() => setSelected(invoice)}
                        >
                          {STRINGS.tenant.invoiceDetailAction}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <Modal
          title={`${STRINGS.invoice.detailHeading} · ${selected.period}`}
          onClose={() => setSelected(null)}
        >
          <InvoiceLineTable invoice={selected} />

          <div className="invoice-total">
            <div>
              <div className="stat-label">{STRINGS.invoice.totalLabel}</div>
              <b className="num">{formatMoney(selected.total)}</b>
            </div>
            <div>
              <div className="stat-label">{STRINGS.invoice.columnPaid}</div>
              <strong className="num">{formatMoney(selected.paid_amount)}</strong>
            </div>
            <div>
              <div className="stat-label">{STRINGS.tenant.invoiceRemainingLabel}</div>
              <strong className="num">
                {formatMoney(Math.max(selected.total - selected.paid_amount, 0))}
              </strong>
            </div>
            <div>
              <div className="stat-label">{STRINGS.invoice.dueLabel}</div>
              <strong className="num">{formatDate(selected.due_date)}</strong>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
