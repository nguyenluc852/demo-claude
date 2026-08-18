import { Badge } from '../atoms'
import type { BadgeStatus } from '../atoms'

interface StatusBadgeProps {
  label: string
  tone: BadgeStatus
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <Badge label={label} status={tone} />
}
