import type { ReactNode } from 'react'

interface SiteLayoutProps {
  header: ReactNode
  children: ReactNode
  footer: ReactNode
}

/** Marketing shell: sticky header, full-bleed sections, footer. */
export function SiteLayout({ header, children, footer }: SiteLayoutProps) {
  return (
    <div className="site">
      {header}
      <main>{children}</main>
      {footer}
    </div>
  )
}
