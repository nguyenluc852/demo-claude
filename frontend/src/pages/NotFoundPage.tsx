import { Link } from 'react-router-dom'

import { Button } from '../components/atoms'
import { AuthLayout } from '../components/templates'
import { ROUTE_PATH, STRINGS } from '../constants'

export function NotFoundPage() {
  return (
    <AuthLayout>
      <div className="auth-card">
        <h1>{STRINGS.errors.notFoundPage}</h1>
        <Link to={ROUTE_PATH.home}>
          <Button variant="primary">{STRINGS.nav.home}</Button>
        </Link>
      </div>
    </AuthLayout>
  )
}
