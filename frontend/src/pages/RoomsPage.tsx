import { RoomManager } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function RoomsPage() {
  return (
    <PageTemplate title={STRINGS.nav.rooms}>
      <RoomManager />
    </PageTemplate>
  )
}
