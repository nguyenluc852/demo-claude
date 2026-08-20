import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { STRINGS } from '../../constants'
import { formatNumber } from '../../utils/format'
import { EmptyState } from './EmptyState'

export interface UsagePoint {
  period: string
  usage: number
}

interface UsageChartProps {
  points: readonly UsagePoint[]
  /** Series name shown in the tooltip — already carries its unit, e.g. "Điện (kWh)". */
  label: string
  color: string
}

const CHART_HEIGHT = 280
const BAR_MAX_WIDTH = 56

/**
 * One utility at a time, on purpose. Electricity is counted in kWh and water in
 * m³, and the two run an order of magnitude apart, so stacking them on a shared
 * axis would draw water as a flat line against electricity and invite a
 * comparison that means nothing.
 */
export function UsageChart({ points, label, color }: UsageChartProps) {
  if (points.length === 0) {
    return <EmptyState message={STRINGS.tenant.usageEmpty} />
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={points as UsagePoint[]}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          tickFormatter={(value: number) => formatNumber(value)}
          tickLine={false}
          axisLine={false}
          width={60}
          fontSize={12}
        />
        <Tooltip formatter={(value) => [formatNumber(Number(value)), label]} />
        {/* Capped: with only a handful of periods recharts stretches each bar
            until they touch and the series reads as one block, not as months. */}
        <Bar dataKey="usage" name={label} fill={color} maxBarSize={BAR_MAX_WIDTH} />
      </BarChart>
    </ResponsiveContainer>
  )
}
