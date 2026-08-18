interface SpinnerProps {
  label: string
}

/** Label is required so a loading state can never ship without describing itself. */
export function Spinner({ label }: SpinnerProps) {
  return <p role="status">{label}</p>
}
