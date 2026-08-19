import { NavLink } from 'react-router-dom'

import { ROUTE_PATH, SLICE, STRINGS, USER_ROLE } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import { Button, Logo, Text } from '../atoms'
import { roleLabel } from '../../utils/labels'

const LINKS = [
  { to: ROUTE_PATH.admin, label: STRINGS.nav.dashboard, end: true },
  { to: ROUTE_PATH.adminRooms, label: STRINGS.nav.rooms, end: false },
  { to: ROUTE_PATH.adminContracts, label: STRINGS.nav.contracts, end: false },
  { to: ROUTE_PATH.adminMeters, label: STRINGS.nav.meters, end: false },
  { to: ROUTE_PATH.adminInvoices, label: STRINGS.nav.invoices, end: false },
  { to: ROUTE_PATH.adminServices, label: STRINGS.nav.services, end: false },
  { to: ROUTE_PATH.adminLeads, label: STRINGS.nav.leads, end: false },
] as const

export function AdminSidebar() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state[SLICE.auth])

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <Logo />
        <small>{STRINGS.app.tagline}</small>
      </div>

      <nav className="admin-nav">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.label}
          </NavLink>
        ))}
        {/* Account administration is the admin's alone; a manager never sees it. */}
        {user?.role === USER_ROLE.admin ? (
          <NavLink to={ROUTE_PATH.adminUsers}>{STRINGS.nav.users}</NavLink>
        ) : null}
      </nav>

      <div className="admin-foot">
        {user ? (
          <Text tone="muted">
            {user.username} · {roleLabel(user.role)}
          </Text>
        ) : null}
        <NavLink to={ROUTE_PATH.home}>{STRINGS.nav.home}</NavLink>
        <Button variant="secondary" size="sm" onClick={() => dispatch(logout())}>
          {STRINGS.nav.logout}
        </Button>
      </div>
    </aside>
  )
}
