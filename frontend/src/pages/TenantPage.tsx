import { SiteHeader, TenantPortal } from '../components/organisms'
import { PageTemplate, SiteLayout } from '../components/templates'
import { STRINGS } from '../constants'

export function TenantPage() {
  return (
    <SiteLayout
      header={<SiteHeader />}
      footer={
        <footer className="site-footer">
          <div className="site-wrap">{STRINGS.app.title}</div>
        </footer>
      }
    >
      <div className="site-wrap site-section">
        <PageTemplate title={STRINGS.tenant.heading}>
          <TenantPortal />
        </PageTemplate>
      </div>
    </SiteLayout>
  )
}
