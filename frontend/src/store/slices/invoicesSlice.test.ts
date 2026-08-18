import { describe, expect, it } from 'vitest'

import { INVOICE_STATUS, STRINGS } from '../../constants'
import type { Invoice } from '../../types/models'
import reducer, { recordPayment, sendInvoice } from './invoicesSlice'

const invoice: Invoice = {
  id: 'invoice-1',
  room_id: 'room-1',
  room_number: '101',
  contract_id: 'contract-1',
  tenant_name: 'Nguyen Van A',
  tenant_email: 'tenant@example.com',
  period: '2026-08',
  room_charge: 3_000_000,
  lines: [],
  total: 4_005_000,
  paid_amount: 0,
  status: INVOICE_STATUS.draft,
  due_date: '2026-08-28T00:00:00Z',
  sent_at: null,
  created_at: '2026-08-18T00:00:00Z',
}

function stateWithInvoice() {
  return { ...reducer(undefined, { type: '@@init' }), entities: [invoice] }
}

describe('invoicesSlice', () => {
  it('locks the row while a send is in flight', () => {
    const state = reducer(stateWithInvoice(), {
      type: sendInvoice.pending.type,
      meta: { arg: invoice.id },
    })

    expect(state.pendingIds).toContain(invoice.id)
  })

  it('replaces the invoice and announces the send', () => {
    const sent = { ...invoice, status: INVOICE_STATUS.unpaid, sent_at: '2026-08-18T01:00:00Z' }

    const state = reducer(stateWithInvoice(), {
      type: sendInvoice.fulfilled.type,
      payload: sent,
      meta: { arg: invoice.id },
    })

    expect(state.entities[0].status).toBe(INVOICE_STATUS.unpaid)
    expect(state.notice).toBe(STRINGS.invoice.sentToast)
  })

  it('keeps the payment state the server returned after a payment update', () => {
    const paid = { ...invoice, paid_amount: invoice.total, status: INVOICE_STATUS.paid }

    const state = reducer(stateWithInvoice(), {
      type: recordPayment.fulfilled.type,
      payload: paid,
      meta: { arg: { id: invoice.id, paidAmount: invoice.total } },
    })

    expect(state.entities[0].status).toBe(INVOICE_STATUS.paid)
    expect(state.pendingIds).not.toContain(invoice.id)
  })
})
