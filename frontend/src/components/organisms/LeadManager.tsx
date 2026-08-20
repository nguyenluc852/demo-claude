import { useEffect } from 'react'

import { SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { deleteLead, fetchLeads, updateLeadStatus } from '../../store/slices/leadsSlice'
import type { Lead } from '../../types/models'
import { formatDate } from '../../utils/format'
import { LEAD_STATUS_OPTIONS } from '../../utils/labels'
import { Button, Select, Spinner } from '../atoms'
import { EmptyState, Notice } from '../molecules'

export function LeadManager() {
  const dispatch = useAppDispatch()
  const { entities, status, pendingIds, error } = useAppSelector((state) => state[SLICE.leads])

  useEffect(() => {
    void dispatch(fetchLeads())
  }, [dispatch])

  async function onDelete(lead: Lead) {
    if (window.confirm(STRINGS.lead.deleteConfirm)) {
      await dispatch(deleteLead(lead.id))
    }
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.lead.heading}</h2>
      </div>

      {error ? <Notice message={error} tone="danger" /> : null}
      {status === STATUS.loading ? <Spinner label={STRINGS.common.loading} /> : null}

      {status === STATUS.succeeded && entities.length === 0 ? (
        <EmptyState message={STRINGS.lead.empty} />
      ) : (
        <div className="table-scroll table-cards">
          <table>
            <thead>
              <tr>
                <th>{STRINGS.lead.createdLabel}</th>
                <th>{STRINGS.lead.nameLabel}</th>
                <th>{STRINGS.lead.phoneLabel}</th>
                <th>{STRINGS.lead.emailLabel}</th>
                <th>{STRINGS.lead.roomLabel}</th>
                <th>{STRINGS.lead.messageLabel}</th>
                <th>{STRINGS.lead.statusLabel}</th>
                <th>{STRINGS.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((lead) => {
                const pending = pendingIds.includes(lead.id)
                return (
                  <tr key={lead.id}>
                    <td className="num" data-label={STRINGS.lead.createdLabel}>
                      {formatDate(lead.created_at)}
                    </td>
                    <td data-label={STRINGS.lead.nameLabel}>{lead.name}</td>
                    <td className="num" data-label={STRINGS.lead.phoneLabel}>{lead.phone}</td>
                    <td data-label={STRINGS.lead.emailLabel}>{lead.email ?? STRINGS.common.unknown}</td>
                    <td className="num" data-label={STRINGS.lead.roomLabel}>
                      {lead.room_number ?? STRINGS.common.unknown}
                    </td>
                    <td data-label={STRINGS.lead.messageLabel}>{lead.message ?? STRINGS.common.unknown}</td>
                    <td data-label={STRINGS.lead.statusLabel}>
                      <Select
                        value={lead.status}
                        disabled={pending}
                        aria-label={`${STRINGS.lead.statusLabel} ${lead.name}`}
                        onChange={(event) =>
                          void dispatch(
                            updateLeadStatus({ id: lead.id, status: event.target.value }),
                          )
                        }
                      >
                        {LEAD_STATUS_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={pending}
                          onClick={() => void onDelete(lead)}
                        >
                          {STRINGS.common.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
