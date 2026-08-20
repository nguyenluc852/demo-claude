import { SiteHeader, TenantNav, TenantProfile } from '../components/organisms'
import { PageTemplate, SiteLayout } from '../components/templates'
import { STRINGS } from '../constants'

export function TenantProfilePage() {
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
        <PageTemplate title={STRINGS.tenant.profilePageHeading} status={<TenantNav />}>
          <TenantProfile />
        </PageTemplate>
      </div>
    </SiteLayout>
  )
}
