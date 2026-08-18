import { HealthBanner, RevenueChart, RoomBoard, SummaryCards } from '../components/organisms'
import { PageTemplate } from '../components/templates'
import { STRINGS } from '../constants'

export function DashboardPage() {
  return (
    <PageTemplate
      title={STRINGS.dashboard.heading}
      subtitle={STRINGS.dashboard.subtitle}
      status={<HealthBanner />}
    >
      <div className="stack">
        <SummaryCards />
        <RoomBoard />
        <RevenueChart />
      </div>
    </PageTemplate>
  )
}
