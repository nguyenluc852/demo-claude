import { ServiceManager } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function ServicesPage() {
  return (
    <PageTemplate title={STRINGS.nav.services}>
      <ServiceManager />
    </PageTemplate>
  )
}
