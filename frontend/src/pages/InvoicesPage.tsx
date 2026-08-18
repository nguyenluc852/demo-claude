import { InvoiceManager } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function InvoicesPage() {
  return (
    <PageTemplate title={STRINGS.nav.invoices}>
      <InvoiceManager />
    </PageTemplate>
  )
}
