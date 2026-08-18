import { LeadManager } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function LeadsPage() {
  return (
    <PageTemplate title={STRINGS.nav.leads}>
      <LeadManager />
    </PageTemplate>
  )
}
