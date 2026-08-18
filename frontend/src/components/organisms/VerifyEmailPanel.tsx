import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { QUERY_PARAM, ROUTE_PATH, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { verifyEmail } from '../../store/slices/authSlice'
import { Button, Spinner } from '../atoms'
import { Notice } from '../molecules'

/** Landing page for the link in the tenant's verification email. */
export function VerifyEmailPanel() {
  const dispatch = useAppDispatch()
  const [params] = useSearchParams()
  const token = params.get(QUERY_PARAM.token)
  const { verifyStatus, verifyMessage } = useAppSelector((state) => state[SLICE.auth])

  useEffect(() => {
    if (token) {
      void dispatch(verifyEmail(token))
    }
  }, [dispatch, token])

  return (
    <div className="auth-card">
      <h1>{STRINGS.auth.verifyHeading}</h1>

      {!token ? <Notice message={STRINGS.auth.verifyMissingToken} tone="danger" /> : null}
      {token && verifyStatus === STATUS.loading ? (
        <Spinner label={STRINGS.auth.verifying} />
      ) : null}
      {verifyStatus === STATUS.succeeded && verifyMessage ? (
        <Notice message={verifyMessage} tone="success" />
      ) : null}
      {verifyStatus === STATUS.failed && verifyMessage ? (
        <Notice message={verifyMessage} tone="danger" />
      ) : null}

      <Link to={ROUTE_PATH.login}>
        <Button variant="primary">{STRINGS.auth.goToLogin}</Button>
      </Link>
    </div>
  )
}
