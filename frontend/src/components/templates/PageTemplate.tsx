import type { ReactNode } from 'react'

interface PageTemplateProps {
  title: string
  subtitle?: string
  status?: ReactNode
  children: ReactNode
}

/** Layout only — templates hold no state and never touch the store. */
export function PageTemplate({ title, subtitle, status, children }: PageTemplateProps) {
  return (
    <main>
      <header>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        {status}
      </header>
      {children}
    </main>
  )
}
