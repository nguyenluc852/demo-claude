import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  /** While true the button is disabled and shows `loadingLabel` instead. */
  loading?: boolean
  loadingLabel?: string
}

/**
 * Disabling on `loading` is the app-wide double-click guard: every button that
 * fires a request passes its in-flight state here rather than re-implementing it.
 */
export function Button({
  children,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingLabel,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  )
}
