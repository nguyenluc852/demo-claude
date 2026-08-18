import { Link } from 'react-router-dom'

import { ROUTE_PATH, SLICE, STRINGS, USER_ROLE } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import { Button, Text } from '../atoms'
import { roleLabel } from '../../utils/labels'

/** Public header. Signed in, it routes the visitor to the area their role owns. */
export function SiteHeader() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state[SLICE.auth])

  const homeFor = user?.role === USER_ROLE.tenant ? ROUTE_PATH.tenant : ROUTE_PATH.admin
  const homeLabel =
    user?.role === USER_ROLE.tenant ? STRINGS.nav.tenantArea : STRINGS.nav.adminArea

  return (
    <header className="site-header">
      <Link to={ROUTE_PATH.home}>
        <strong>{STRINGS.app.title}</strong>
      </Link>
      <nav className="toolbar">
        {user ? (
          <>
            <Text tone="muted">
              {user.username} · {roleLabel(user.role)}
            </Text>
            <Link to={homeFor}>
              <Button variant="accent" size="sm">
                {homeLabel}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => dispatch(logout())}>
              {STRINGS.nav.logout}
            </Button>
          </>
        ) : (
          <Link to={ROUTE_PATH.login}>
            <Button variant="accent" size="sm">
              {STRINGS.nav.login}
            </Button>
          </Link>
        )}
      </nav>
    </header>
  )
}
