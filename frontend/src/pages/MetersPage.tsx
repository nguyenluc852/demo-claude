import { MeterGrid } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function MetersPage() {
  return (
    <PageTemplate title={STRINGS.nav.meters}>
      <MeterGrid />
    </PageTemplate>
  )
}
