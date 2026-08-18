import { useEffect } from 'react'

import { SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchSummary } from '../../store/slices/dashboardSlice'
import { Spinner } from '../atoms'
import { Notice, StatCard } from '../molecules'
import { formatMoney } from '../../utils/format'

export function SummaryCards() {
  const dispatch = useAppDispatch()
  const { summary, status, error } = useAppSelector((state) => state[SLICE.dashboard])

  useEffect(() => {
    void dispatch(fetchSummary())
  }, [dispatch])

  if (status === STATUS.loading || status === STATUS.idle) {
    return <Spinner label={STRINGS.common.loading} />
  }

  if (!summary) {
    return error ? <Notice message={error} tone="danger" /> : null
  }

  return (
    <div className="stat-grid">
      <StatCard label={STRINGS.dashboard.totalRooms} value={String(summary.total_rooms)} />
      <StatCard
        label={STRINGS.dashboard.availableRooms}
        value={String(summary.available_rooms)}
      />
      <StatCard label={STRINGS.dashboard.occupiedRooms} value={String(summary.occupied_rooms)} />
      <StatCard
        label={STRINGS.dashboard.activeContracts}
        value={String(summary.active_contracts)}
        hint={`${STRINGS.dashboard.expiringContracts}: ${summary.expiring_contracts}`}
      />
      <StatCard
        label={STRINGS.dashboard.monthRevenue}
        value={formatMoney(summary.current_month_revenue)}
      />
      <StatCard
        label={STRINGS.dashboard.outstandingAmount}
        value={formatMoney(summary.outstanding_amount)}
        hint={`${STRINGS.dashboard.unpaidInvoices}: ${summary.unpaid_invoices}`}
      />
    </div>
  )
}
