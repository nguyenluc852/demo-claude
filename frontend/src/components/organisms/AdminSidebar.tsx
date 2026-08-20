import { useState } from 'react'
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

const NAV_ID = 'admin-nav'

export function AdminSidebar() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state[SLICE.auth])
  /* Only consulted below the shell's breakpoint, where the rail becomes a bar
     across the top: eight links laid out there cost several rows of screen. On
     a desktop the rail is always open and this stays false. */
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside className="admin-sidebar" data-menu-open={menuOpen}>
      <div className="admin-brand">
        <div className="admin-brand-row">
          <Logo />
          <Button
            className="admin-menu-toggle"
            variant="secondary"
            size="sm"
            aria-expanded={menuOpen}
            aria-controls={NAV_ID}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {STRINGS.nav.menu}
          </Button>
        </div>
        <small>{STRINGS.app.tagline}</small>
      </div>

      {/* Closing on navigation: the panel covers the page it just moved to,
          so leaving it open would hide the result of the tap. */}
      <nav className="admin-nav" id={NAV_ID} onClick={() => setMenuOpen(false)}>
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
