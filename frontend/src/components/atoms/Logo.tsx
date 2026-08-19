import { STRINGS } from '../../constants'

/**
 * The house mark, matching public/favicon.svg. Three lit openings rather than
 * one window: this is a building let by the room, not a single home.
 *
 * Inline rather than an <img> so the mark inherits the surrounding colour and
 * needs no second network request in the header.
 */
export function Logo({ wordmark = true }: { wordmark?: boolean }) {
  return (
    <span className="logo">
      <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--orange-600)" />
        <path
          d="M32 13.5 51 29v20a2.5 2.5 0 0 1-2.5 2.5h-33A2.5 2.5 0 0 1 13 49V29z"
          fill="none"
          stroke="var(--slate-900)"
          strokeWidth="3.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <rect x="21.5" y="33" width="7" height="6.5" rx="1.6" fill="var(--slate-900)" />
        <rect x="35.5" y="33" width="7" height="6.5" rx="1.6" fill="var(--slate-900)" />
        <path d="M28 51.5v-7a4 4 0 0 1 8 0v7z" fill="var(--slate-900)" />
      </svg>
      {wordmark ? <strong>{STRINGS.app.title}</strong> : null}
    </span>
  )
}
