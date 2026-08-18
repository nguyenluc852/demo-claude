import { ContractManager } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function ContractsPage() {
  return (
    <PageTemplate title={STRINGS.nav.contracts}>
      <ContractManager />
    </PageTemplate>
  )
}
