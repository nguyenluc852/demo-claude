interface SpinnerProps {
  label: string
  /** Hide the text and keep only the dot, for tight spots like a table cell. */
  compact?: boolean
}

/** Label is required so a loading state can never ship without describing itself. */
export function Spinner({ label, compact = false }: SpinnerProps) {
  return (
    <p role="status" className="toolbar">
      <span className="spinner-dot" aria-hidden="true" />
      {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </p>
  )
}
