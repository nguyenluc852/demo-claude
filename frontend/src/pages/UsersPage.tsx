import { UserManager } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function UsersPage() {
  return (
    <PageTemplate title={STRINGS.nav.users}>
      <UserManager />
    </PageTemplate>
  )
}
