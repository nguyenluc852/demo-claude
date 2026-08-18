import { useEffect, useState } from 'react'

import { invoicesApi } from '../../api/endpoints'
import { INVOICE_STATUS, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  clearNotice,
  fetchInvoices,
  recordPayment,
  sendInvoice,
  setPeriodFilter,
  setStatusFilter,
} from '../../store/slices/invoicesSlice'
import type { Invoice } from '../../types/models'
import { formatDate, formatMoney, formatNumber } from '../../utils/format'
import {
  INVOICE_STATUS_OPTIONS,
  invoiceStatusLabel,
  invoiceStatusTone,
  serviceUnitLabel,
} from '../../utils/labels'
import { Button, Input, Select, Spinner } from '../atoms'
import { EmptyState, Modal, Notice, StatusBadge } from '../molecules'

/** Downloads the PDF the API renders, then releases the temporary object URL. */
async function downloadPdf(invoice: Invoice) {
  const blob = await invoicesApi.pdf(invoice.id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${invoice.room_number ?? invoice.id}-${invoice.period}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

export function InvoiceManager() {
  const dispatch = useAppDispatch()
  const { entities, status, pendingIds, statusFilter, periodFilter, notice, error } =
    useAppSelector((state) => state[SLICE.invoices])

  const [selected, setSelected] = useState<Invoice | null>(null)
  const [paidAmount, setPaidAmount] = useState('')

  useEffect(() => {
    void dispatch(fetchInvoices({ status: statusFilter, period: periodFilter }))
  }, [dispatch, statusFilter, periodFilter])

  // Keep the open modal in step with the row the store just replaced.
  useEffect(() => {
    if (selected) {
      const fresh = entities.find((invoice) => invoice.id === selected.id)
      if (fresh && fresh !== selected) {
        setSelected(fresh)
      }
    }
  }, [entities, selected])

  function openDetail(invoice: Invoice) {
    setSelected(invoice)
    setPaidAmount(String(invoice.paid_amount))
  }

  const isPending = (id: string) => pendingIds.includes(id)

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.invoice.heading}</h2>
        <div className="toolbar">
          <Select
            value={statusFilter}
            aria-label={STRINGS.invoice.columnStatus}
            onChange={(event) => dispatch(setStatusFilter(event.target.value))}
          >
            <option value="">{STRINGS.common.all}</option>
            {INVOICE_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            type="month"
            value={periodFilter}
            aria-label={STRINGS.invoice.columnPeriod}
            onChange={(event) => dispatch(setPeriodFilter(event.target.value))}
          />
        </div>
      </div>

      {error ? <Notice message={error} tone="danger" /> : null}
      {notice ? (
        <p className="notice" data-tone="success" role="status">
          {notice}{' '}
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearNotice())}>
            {STRINGS.common.close}
          </Button>
        </p>
      ) : null}

      {status === STATUS.loading && entities.length === 0 ? (
        <Spinner label={STRINGS.common.loading} />
      ) : null}

      {status === STATUS.succeeded && entities.length === 0 ? (
        <EmptyState message={STRINGS.invoice.empty} />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{STRINGS.invoice.columnRoom}</th>
                <th>{STRINGS.invoice.columnTenant}</th>
                <th>{STRINGS.invoice.columnPeriod}</th>
                <th className="num">{STRINGS.invoice.columnTotal}</th>
                <th className="num">{STRINGS.invoice.columnPaid}</th>
                <th>{STRINGS.invoice.columnStatus}</th>
                <th>{STRINGS.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <strong className="num">{invoice.room_number}</strong>
                  </td>
                  <td>{invoice.tenant_name}</td>
                  <td className="num">{invoice.period}</td>
                  <td className="num">{formatMoney(invoice.total)}</td>
                  <td className="num">{formatMoney(invoice.paid_amount)}</td>
                  <td>
                    <StatusBadge
                      label={invoiceStatusLabel(invoice.status)}
                      tone={invoiceStatusTone(invoice.status)}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button size="sm" variant="ghost" onClick={() => openDetail(invoice)}>
                        {STRINGS.invoice.detailHeading}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={isPending(invoice.id)}
                        loadingLabel={STRINGS.invoice.sending}
                        onClick={() => void dispatch(sendInvoice(invoice.id))}
                      >
                        {invoice.sent_at
                          ? STRINGS.invoice.resendAction
                          : STRINGS.invoice.sendAction}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <Modal
          title={`${STRINGS.invoice.detailHeading} · ${selected.room_number} · ${selected.period}`}
          onClose={() => setSelected(null)}
          busy={isPending(selected.id)}
          busyLabel={STRINGS.common.updating}
          footer={
            <>
              <Button variant="secondary" onClick={() => void downloadPdf(selected)}>
                {STRINGS.invoice.pdfAction}
              </Button>
              <Button
                variant="primary"
                loading={isPending(selected.id)}
                loadingLabel={STRINGS.invoice.sending}
                onClick={() => void dispatch(sendInvoice(selected.id))}
              >
                {selected.sent_at ? STRINGS.invoice.resendAction : STRINGS.invoice.sendAction}
              </Button>
            </>
          }
        >
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
                  <td className="num">1</td>
                  <td className="num">{formatMoney(selected.room_charge)}</td>
                  <td className="num">{formatMoney(selected.room_charge)}</td>
                </tr>
                {selected.lines.map((line) => (
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

          <div className="invoice-total">
            <div>
              <div className="stat-label">{STRINGS.invoice.totalLabel}</div>
              <b className="num">{formatMoney(selected.total)}</b>
            </div>
            <div>
              <div className="stat-label">{STRINGS.invoice.dueLabel}</div>
              <strong className="num">{formatDate(selected.due_date)}</strong>
            </div>
            <div>
              <div className="stat-label">{STRINGS.invoice.sentAtLabel}</div>
              <strong className="num">{formatDate(selected.sent_at)}</strong>
            </div>
          </div>

          <div className="field">
            <span>{STRINGS.invoice.paymentHeading}</span>
            <div className="toolbar">
              <Input
                type="number"
                className="num"
                value={paidAmount}
                aria-label={STRINGS.invoice.paymentLabel}
                disabled={isPending(selected.id)}
                onChange={(event) => setPaidAmount(event.target.value)}
              />
              <Button
                variant="secondary"
                loading={isPending(selected.id)}
                loadingLabel={STRINGS.common.updating}
                onClick={() =>
                  void dispatch(
                    recordPayment({ id: selected.id, paidAmount: Number(paidAmount) }),
                  )
                }
              >
                {STRINGS.invoice.paymentAction}
              </Button>
              <Button
                variant="secondary"
                disabled={
                  isPending(selected.id) || selected.status === INVOICE_STATUS.paid
                }
                onClick={() =>
                  void dispatch(
                    recordPayment({ id: selected.id, paidAmount: selected.total }),
                  )
                }
              >
                {STRINGS.invoice.markPaidAction}
              </Button>
            </div>
          </div>

          {error ? <Notice message={error} tone="danger" /> : null}
        </Modal>
      ) : null}
    </section>
  )
}
