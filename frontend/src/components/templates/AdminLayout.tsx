import type { ReactNode } from 'react'

interface AdminLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

/** Two-column CMS shell: fixed navigation beside the scrolling work area. */
export function AdminLayout({ sidebar, children }: AdminLayoutProps) {
  return (
    <div className="admin-shell">
      {sidebar}
      <main className="admin-main">{children}</main>
    </div>
  )
}
