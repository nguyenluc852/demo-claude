import { STRINGS } from '../constants'
import { HealthBanner, ItemForm, ItemList } from '../components/organisms'
import { PageTemplate } from '../components/templates'

export function HomePage() {
  return (
    <PageTemplate
      title={STRINGS.app.title}
      subtitle={STRINGS.app.tagline}
      status={<HealthBanner />}
    >
      <section>
        <h2>{STRINGS.items.heading}</h2>
        <ItemForm />
        <ItemList />
      </section>
    </PageTemplate>
  )
}
