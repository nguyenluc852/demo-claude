interface StatCardProps {
  label: string
  value: string
  hint?: string
  /**
   * `number` (the default) keeps the mono, tabular, single-line treatment that
   * meters, money and periods are built for. `text` is for values that are
   * prose — a name, an email — which that treatment clips instead of wrapping.
   */
  variant?: 'number' | 'text'
}

export function StatCard({ label, value, hint, variant = 'number' }: StatCardProps) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value" data-variant={variant}>
        {value}
      </strong>
      {hint ? <span className="stat-label">{hint}</span> : null}
    </div>
  )
}
