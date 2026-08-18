/** Visual buckets a badge can fall into. Not domain statuses — those map here. */
type BadgeStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'overdue'
  | 'neutral'
  | 'positive'
  | 'warning'

interface BadgeProps {
  label: string
  status: BadgeStatus
}

export function Badge({ label, status }: BadgeProps) {
  return (
    <span className="badge" data-status={status}>
      {label}
    </span>
  )
}

export type { BadgeStatus }
