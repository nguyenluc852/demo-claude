/**
 * Line icons drawn for this project rather than pulled from a set, so the stroke
 * weight sits next to the ledger's hairline rules instead of shouting over them.
 *
 * They live in the component, not in a sprite file: `<use>` pointing at an
 * external SVG does not reliably inherit `currentColor`, and inheriting the text
 * colour is exactly what makes one icon work in both light and dark mode.
 */

const PATHS = {
  fire: (
    <>
      <path d="M12 3c.4 2.6-.8 4-2.2 5.3C8.1 9.8 7 11.2 7 13.4A5 5 0 0 0 12 18a5 5 0 0 0 5-4.6c0-2-1-3.3-2.2-4.6" />
      <path d="M12 18a2.4 2.4 0 0 1-2.4-2.4c0-1.5 1.4-2.2 2.4-3.6 1 1.4 2.4 2.1 2.4 3.6A2.4 2.4 0 0 1 12 18Z" />
      <path d="M5 21h14" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 8.5a15 15 0 0 1 19 0" />
      <path d="M5.5 12a10.5 10.5 0 0 1 13 0" />
      <path d="M8.5 15.5a6 6 0 0 1 7 0" />
      <circle cx="12" cy="19" r="1.1" />
    </>
  ),
  camera: (
    <>
      <path d="M3 7.6 17 4l1.6 5.4L4.6 13Z" />
      <path d="m18.6 9.4 2.6-1.2v5l-2.6-1.2" />
      <path d="M7 12.4V16a2.5 2.5 0 0 0 5 0v-1.6" />
      <path d="M5 20h6" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 11v2.5a8 8 0 0 1-1.2 4.2" />
      <path d="M8.8 9.4a4 4 0 0 1 6.4 3.2c0 1.6-.2 3.2-.7 4.7" />
      <path d="M5.8 12.6a6.8 6.8 0 0 1 2-5.6" />
      <path d="M18.2 13.6c.1-1.2.1-2.4 0-3.2A6.4 6.4 0 0 0 9 5.4" />
      <path d="M8.4 20a11 11 0 0 0 2-4.6" />
    </>
  ),
  broom: (
    <>
      <path d="M18 3 10.5 10.5" />
      <path d="M7 12.5h6.5l1.6 5.3a1.5 1.5 0 0 1-1.4 1.9H6.8a1.5 1.5 0 0 1-1.4-1.9Z" />
      <path d="M8.6 13v6.7M11.6 13v6.7" />
    </>
  ),
  laundry: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <circle cx="12" cy="13.5" r="4" />
      <path d="M8.6 12.4c1.4 1.1 2.4-.9 3.8 0s2.4-1 3.4 0" />
      <path d="M7.6 7h1.6M11.4 7h5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m11 11 8 8" />
      <path d="m16.5 16.5 2-2M19 19l1.5-1.5" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  chevron: <path d="m6 9.5 6 6 6-6" />,
  pin: (
    <>
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6 6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  meter: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M7 13h3.5M13.5 13H17M7 16.2h10" />
    </>
  ),
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  /** Decorative by default; pass a label when the icon is the only content. */
  label?: string
}

export function Icon({ name, label }: IconProps) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : 'presentation'}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {PATHS[name]}
    </svg>
  )
}
