import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { SERVICE_CATEGORY, SERVICE_UNIT, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from '../../store/slices/servicesSlice'
import type { ServiceInput, ServicePrice } from '../../types/models'
import { formatMoney } from '../../utils/format'
import {
  CATEGORY_OPTIONS,
  UNIT_OPTIONS,
  serviceCategoryLabel,
  serviceUnitLabel,
} from '../../utils/labels'
import { Button, Input, Spinner } from '../atoms'
import { EmptyState, FormField, Modal, Notice, SelectField, StatusBadge } from '../molecules'

const EMPTY_FORM: ServiceInput = {
  code: '',
  name: '',
  unit_price: 0,
  unit: SERVICE_UNIT.perMonth,
  category: SERVICE_CATEGORY.fixed,
  active: true,
}

export function ServiceManager() {
  const dispatch = useAppDispatch()
  const { entities, status, submitting, error } = useAppSelector(
    (state) => state[SLICE.services],
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ServicePrice | null>(null)
  const [form, setForm] = useState<ServiceInput>(EMPTY_FORM)

  useEffect(() => {
    void dispatch(fetchServices())
  }, [dispatch])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(service: ServicePrice) {
    setEditing(service)
    setForm({
      code: service.code,
      name: service.name,
      unit_price: service.unit_price,
      unit: service.unit,
      category: service.category,
      active: service.active,
    })
    setOpen(true)
  }

  function update<K extends keyof ServiceInput>(field: K, value: ServiceInput[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (editing) {
      const { code: _code, ...editable } = form
      const result = await dispatch(updateService({ id: editing.id, payload: editable }))
      if (updateService.fulfilled.match(result)) {
        setOpen(false)
      }
      return
    }
    const result = await dispatch(createService(form))
    if (createService.fulfilled.match(result)) {
      setOpen(false)
    }
  }

  async function onDelete(service: ServicePrice) {
    if (window.confirm(STRINGS.service.deleteConfirm)) {
      await dispatch(deleteService(service.id))
    }
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.service.heading}</h2>
        <Button variant="accent" onClick={openCreate}>
          {STRINGS.service.addAction}
        </Button>
      </div>

      <p data-tone="muted">{STRINGS.service.subtitle}</p>

      {error && !open ? <Notice message={error} tone="danger" /> : null}
      {status === STATUS.loading ? <Spinner label={STRINGS.common.loading} /> : null}

      {status === STATUS.succeeded && entities.length === 0 ? (
        <EmptyState message={STRINGS.service.empty} />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{STRINGS.service.codeLabel}</th>
                <th>{STRINGS.service.nameLabel}</th>
                <th className="num">{STRINGS.service.priceLabel}</th>
                <th>{STRINGS.service.unitLabel}</th>
                <th>{STRINGS.service.categoryLabel}</th>
                <th>{STRINGS.service.activeLabel}</th>
                <th>{STRINGS.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((service) => (
                <tr key={service.id}>
                  <td>
                    <code>{service.code}</code>
                  </td>
                  <td>{service.name}</td>
                  <td className="num">{formatMoney(service.unit_price)}</td>
                  <td>{serviceUnitLabel(service.unit)}</td>
                  <td>{serviceCategoryLabel(service.category)}</td>
                  <td>
                    <StatusBadge
                      label={
                        service.active
                          ? STRINGS.service.activeLabel
                          : STRINGS.service.inactiveLabel
                      }
                      tone={service.active ? 'positive' : 'neutral'}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(service)}>
                        {STRINGS.common.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={submitting}
                        onClick={() => void onDelete(service)}
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
          title={editing ? STRINGS.service.editAction : STRINGS.service.addAction}
          onClose={() => setOpen(false)}
          busy={submitting}
          footer={
            <>
              <Button variant="secondary" disabled={submitting} onClick={() => setOpen(false)}>
                {STRINGS.common.cancel}
              </Button>
              <Button
                type="submit"
                form="service-form"
                variant="primary"
                loading={submitting}
                loadingLabel={STRINGS.common.saving}
              >
                {STRINGS.common.save}
              </Button>
            </>
          }
        >
          <form id="service-form" className="stack" onSubmit={onSubmit}>
            <div className="field-row">
              <FormField
                label={STRINGS.service.codeLabel}
                name="code"
                value={form.code}
                required
                disabled={Boolean(editing)}
                onChange={(event) => update('code', event.target.value)}
              />
              <FormField
                label={STRINGS.service.nameLabel}
                name="name"
                value={form.name}
                required
                onChange={(event) => update('name', event.target.value)}
              />
              <FormField
                label={STRINGS.service.priceLabel}
                name="unit_price"
                type="number"
                value={form.unit_price}
                required
                onChange={(event) => update('unit_price', Number(event.target.value))}
              />
              <SelectField
                label={STRINGS.service.unitLabel}
                name="unit"
                value={form.unit}
                options={UNIT_OPTIONS}
                onChange={(value) => update('unit', value)}
              />
              <SelectField
                label={STRINGS.service.categoryLabel}
                name="category"
                value={form.category}
                options={CATEGORY_OPTIONS}
                onChange={(value) => update('category', value)}
              />
            </div>

            <label className="field checkbox-field" htmlFor="active">
              <Input
                id="active"
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={(event) => update('active', event.target.checked)}
              />
              <span>{STRINGS.service.activeLabel}</span>
            </label>

            {error ? <Notice message={error} tone="danger" /> : null}
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
