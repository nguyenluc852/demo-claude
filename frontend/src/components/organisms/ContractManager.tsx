import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { PAYMENT_CYCLE, ROOM_STATUS, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  createContract,
  deleteContract,
  fetchContracts,
  updateContract,
} from '../../store/slices/contractsSlice'
import { fetchRooms } from '../../store/slices/roomsSlice'
import type { Contract, ContractInput } from '../../types/models'
import { formatDate, formatMoney, toDateInput } from '../../utils/format'
import {
  CONTRACT_STATUS_OPTIONS,
  CYCLE_OPTIONS,
  contractStatusLabel,
  contractStatusTone,
} from '../../utils/labels'
import { Button, Spinner } from '../atoms'
import {
  EmptyState,
  FormField,
  Modal,
  Notice,
  SelectField,
  StatusBadge,
  TextareaField,
} from '../molecules'

const TODAY = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM: ContractInput = {
  room_id: '',
  tenant_name: '',
  tenant_id_card: '',
  tenant_phone: '',
  tenant_email: '',
  start_date: '',
  end_date: '',
  deposit: 0,
  payment_cycle: PAYMENT_CYCLE.monthly,
  occupants: 1,
  note: '',
}

function toForm(contract: Contract): ContractInput {
  return {
    room_id: contract.room_id,
    tenant_name: contract.tenant_name,
    tenant_id_card: contract.tenant_id_card,
    tenant_phone: contract.tenant_phone,
    tenant_email: contract.tenant_email,
    start_date: toDateInput(contract.start_date),
    end_date: toDateInput(contract.end_date),
    deposit: contract.deposit,
    payment_cycle: contract.payment_cycle,
    occupants: contract.occupants,
    note: contract.note ?? '',
  }
}

/** The API stores instants; the form edits dates. */
function toIso(date: string): string {
  return new Date(date).toISOString()
}

export function ContractManager() {
  const dispatch = useAppDispatch()
  const { entities, status, submitting, error } = useAppSelector(
    (state) => state[SLICE.contracts],
  )
  const rooms = useAppSelector((state) => state[SLICE.rooms].entities)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)
  const [form, setForm] = useState<ContractInput>(EMPTY_FORM)
  const [statusValue, setStatusValue] = useState('')

  useEffect(() => {
    void dispatch(fetchContracts())
    void dispatch(fetchRooms(undefined))
  }, [dispatch])

  // A new contract may only target a room that is not already let.
  const selectableRooms = rooms
    .filter((room) => room.status === ROOM_STATUS.available || room.id === editing?.room_id)
    .map((room) => [room.id, room.room_number] as const)

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, start_date: TODAY(), end_date: TODAY() })
    setStatusValue('')
    setOpen(true)
  }

  function openEdit(contract: Contract) {
    setEditing(contract)
    setForm(toForm(contract))
    setStatusValue(contract.status)
    setOpen(true)
  }

  function update<K extends keyof ContractInput>(field: K, value: ContractInput[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const payload = {
      ...form,
      start_date: toIso(form.start_date),
      end_date: toIso(form.end_date),
    }

    if (editing) {
      const { room_id: _roomId, ...editable } = payload
      const result = await dispatch(
        updateContract({ id: editing.id, payload: { ...editable, status: statusValue } }),
      )
      if (updateContract.fulfilled.match(result)) {
        setOpen(false)
      }
      return
    }

    const result = await dispatch(createContract(payload))
    if (createContract.fulfilled.match(result)) {
      setOpen(false)
    }
  }

  async function onDelete(contract: Contract) {
    if (window.confirm(STRINGS.contract.deleteConfirm)) {
      await dispatch(deleteContract(contract.id))
    }
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.contract.heading}</h2>
        <Button variant="accent" onClick={openCreate}>
          {STRINGS.contract.addAction}
        </Button>
      </div>

      {error && !open ? <Notice message={error} tone="danger" /> : null}
      {status === STATUS.loading ? <Spinner label={STRINGS.common.loading} /> : null}

      {status === STATUS.succeeded && entities.length === 0 ? (
        <EmptyState message={STRINGS.contract.empty} />
      ) : (
        <div className="table-scroll table-cards">
          <table>
            <thead>
              <tr>
                <th>{STRINGS.contract.roomLabel}</th>
                <th>{STRINGS.contract.tenantNameLabel}</th>
                <th>{STRINGS.contract.phoneLabel}</th>
                <th>{STRINGS.contract.emailLabel}</th>
                <th>{STRINGS.contract.endLabel}</th>
                <th className="num">{STRINGS.contract.depositLabel}</th>
                <th>{STRINGS.contract.statusLabel}</th>
                <th>{STRINGS.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((contract) => (
                <tr key={contract.id}>
                  <td data-label={STRINGS.contract.roomLabel}>
                    <strong className="num">{contract.room_number}</strong>
                  </td>
                  <td data-label={STRINGS.contract.tenantNameLabel}>{contract.tenant_name}</td>
                  <td className="num" data-label={STRINGS.contract.phoneLabel}>
                    {contract.tenant_phone}
                  </td>
                  <td data-label={STRINGS.contract.emailLabel}>
                    <div className="toolbar">
                      <span>{contract.tenant_email}</span>
                      <StatusBadge
                        label={
                          contract.email_verified
                            ? STRINGS.contract.emailVerified
                            : STRINGS.contract.emailUnverified
                        }
                        tone={contract.email_verified ? 'positive' : 'warning'}
                      />
                    </div>
                  </td>
                  <td className="num" data-label={STRINGS.contract.endLabel}>
                    {formatDate(contract.end_date)}
                  </td>
                  <td className="num" data-label={STRINGS.contract.depositLabel}>
                    {formatMoney(contract.deposit)}
                  </td>
                  <td data-label={STRINGS.contract.statusLabel}>
                    <StatusBadge
                      label={contractStatusLabel(contract.status)}
                      tone={contractStatusTone(contract.status)}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(contract)}>
                        {STRINGS.common.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={submitting}
                        onClick={() => void onDelete(contract)}
                      >
                        {STRINGS.common.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <Modal
          title={editing ? STRINGS.contract.editAction : STRINGS.contract.addAction}
          onClose={() => setOpen(false)}
          busy={submitting}
          footer={
            <>
              <Button variant="secondary" disabled={submitting} onClick={() => setOpen(false)}>
                {STRINGS.common.cancel}
              </Button>
              <Button
                type="submit"
                form="contract-form"
                variant="primary"
                loading={submitting}
                loadingLabel={STRINGS.common.saving}
              >
                {STRINGS.common.save}
              </Button>
            </>
          }
        >
          <form id="contract-form" className="stack" onSubmit={onSubmit}>
            <div className="field-row">
              <SelectField
                label={STRINGS.contract.roomLabel}
                name="room_id"
                value={form.room_id}
                options={selectableRooms}
                placeholder={STRINGS.contract.selectRoom}
                disabled={Boolean(editing)}
                onChange={(value) => update('room_id', value)}
              />
              <FormField
                label={STRINGS.contract.tenantNameLabel}
                name="tenant_name"
                value={form.tenant_name}
                required
                onChange={(event) => update('tenant_name', event.target.value)}
              />
              <FormField
                label={STRINGS.contract.idCardLabel}
                name="tenant_id_card"
                value={form.tenant_id_card}
                required
                onChange={(event) => update('tenant_id_card', event.target.value)}
              />
              <FormField
                label={STRINGS.contract.phoneLabel}
                name="tenant_phone"
                value={form.tenant_phone}
                required
                onChange={(event) => update('tenant_phone', event.target.value)}
              />
              <FormField
                label={STRINGS.contract.emailLabel}
                name="tenant_email"
                type="email"
                value={form.tenant_email}
                required
                onChange={(event) => update('tenant_email', event.target.value)}
              />
              <FormField
                label={STRINGS.contract.occupantsLabel}
                name="occupants"
                type="number"
                min={1}
                value={form.occupants}
                onChange={(event) => update('occupants', Number(event.target.value))}
              />
              <FormField
                label={STRINGS.contract.startLabel}
                name="start_date"
                type="date"
                value={form.start_date}
                required
                onChange={(event) => update('start_date', event.target.value)}
              />
              <FormField
                label={STRINGS.contract.endLabel}
                name="end_date"
                type="date"
                value={form.end_date}
                required
                onChange={(event) => update('end_date', event.target.value)}
              />
              <FormField
                label={STRINGS.contract.depositLabel}
                name="deposit"
                type="number"
                value={form.deposit}
                onChange={(event) => update('deposit', Number(event.target.value))}
              />
              <SelectField
                label={STRINGS.contract.cycleLabel}
                name="payment_cycle"
                value={form.payment_cycle}
                options={CYCLE_OPTIONS}
                onChange={(value) => update('payment_cycle', value)}
              />
              {editing ? (
                <SelectField
                  label={STRINGS.contract.statusLabel}
                  name="contract_status"
                  value={statusValue}
                  options={CONTRACT_STATUS_OPTIONS}
                  onChange={setStatusValue}
                />
              ) : null}
            </div>

            <TextareaField
              label={STRINGS.contract.noteLabel}
              name="note"
              value={form.note ?? ''}
              onChange={(event) => update('note', event.target.value)}
            />

            <Notice message={STRINGS.contract.accountNote} />
            {error ? <Notice message={error} tone="danger" /> : null}
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
