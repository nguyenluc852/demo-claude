import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { ROUTE_PATH, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchMe } from '../../store/slices/authSlice'
import { Spinner } from '../atoms'
import { Notice } from '../molecules'

interface RequireRoleProps {
  roles: readonly string[]
  children: ReactNode
}

/**
 * Route guard. A stored token is exchanged for its user before deciding, so a
 * refresh inside the CMS does not bounce the operator back to the login screen.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const dispatch = useAppDispatch()
  const { user, token, status } = useAppSelector((state) => state[SLICE.auth])

  useEffect(() => {
    if (token && !user && status === STATUS.idle) {
      void dispatch(fetchMe())
    }
  }, [dispatch, token, user, status])

  if (!token) {
    return <Navigate to={ROUTE_PATH.login} replace />
  }

  if (!user) {
    return status === STATUS.failed ? (
      <Navigate to={ROUTE_PATH.login} replace />
    ) : (
      <Spinner label={STRINGS.common.loading} />
    )
  }

  if (!roles.includes(user.role)) {
    return <Notice message={STRINGS.errors.forbiddenPage} tone="danger" />
  }

  return <>{children}</>
}
