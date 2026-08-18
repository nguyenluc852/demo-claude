import { useEffect } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { REVENUE_RANGE, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchRevenue, setMonths } from '../../store/slices/dashboardSlice'
import { formatMoney } from '../../utils/format'
import { Spinner } from '../atoms'
import { EmptyState, Tabs } from '../molecules'

const RANGE_OPTIONS = [
  [String(REVENUE_RANGE.month), STRINGS.dashboard.rangeMonth],
  [String(REVENUE_RANGE.quarter), STRINGS.dashboard.rangeQuarter],
  [String(REVENUE_RANGE.year), STRINGS.dashboard.rangeYear],
] as const

const CHART_HEIGHT = 320
const COLOR_ROOM = '#0d9488'
const COLOR_SERVICE = '#f59e0b'
const COLOR_COLLECTED = '#1c2942'

export function RevenueChart() {
  const dispatch = useAppDispatch()
  const { revenue, months, revenueStatus } = useAppSelector((state) => state[SLICE.dashboard])

  useEffect(() => {
    void dispatch(fetchRevenue(months))
  }, [dispatch, months])

  /**
   * The API always returns a 12-month window; a shorter range is the tail of it,
   * so the filter never needs a second round trip.
   */
  const points = (revenue?.points ?? []).slice(-months)

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.dashboard.revenueHeading}</h2>
        <Tabs
          label={STRINGS.dashboard.revenueHeading}
          value={String(months)}
          options={RANGE_OPTIONS}
          onChange={(value) => dispatch(setMonths(Number(value)))}
        />
      </div>

      {revenueStatus === STATUS.loading && points.length === 0 ? (
        <Spinner label={STRINGS.common.loading} />
      ) : null}

      {revenueStatus === STATUS.succeeded && points.length === 0 ? (
        <EmptyState message={STRINGS.common.empty} />
      ) : null}

      {points.length > 0 ? (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={points}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="period" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value: number) => formatMoney(value)}
              tickLine={false}
              axisLine={false}
              width={110}
              fontSize={12}
            />
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
            <Legend />
            <Bar
              dataKey="room_revenue"
              name={STRINGS.dashboard.revenueRoom}
              stackId="revenue"
              fill={COLOR_ROOM}
            />
            <Bar
              dataKey="service_revenue"
              name={STRINGS.dashboard.revenueService}
              stackId="revenue"
              fill={COLOR_SERVICE}
            />
            <Bar
              dataKey="collected"
              name={STRINGS.dashboard.revenueCollected}
              fill={COLOR_COLLECTED}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </section>
  )
}
