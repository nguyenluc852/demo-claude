import { useLocation, useNavigate } from 'react-router-dom'

import { ROUTE_PATH, STRINGS } from '../../constants'
import { Tabs } from '../molecules'

const NAV_OPTIONS = [
  [ROUTE_PATH.tenant, STRINGS.tenant.navOverview],
  [ROUTE_PATH.tenantProfile, STRINGS.tenant.navProfile],
] as const

/** Switches between the two tenant screens. The current path is the selected
 *  value, so a reload or a pasted link lands on the right tab. */
export function TenantNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <Tabs
      label={STRINGS.tenant.heading}
      value={pathname === ROUTE_PATH.tenantProfile ? ROUTE_PATH.tenantProfile : ROUTE_PATH.tenant}
      options={NAV_OPTIONS}
      onChange={(value) => void navigate(value)}
    />
  )
}
