import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTE_PATH, SLICE, STRINGS, USER_ROLE } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { login } from '../../store/slices/authSlice'
import { Button } from '../atoms'
import { FormField, Notice } from '../molecules'

export function LoginForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { submitting, error } = useAppSelector((state) => state[SLICE.auth])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      const { role } = result.payload.user
      navigate(role === USER_ROLE.tenant ? ROUTE_PATH.tenant : ROUTE_PATH.admin)
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <div>
        <h1>{STRINGS.auth.loginHeading}</h1>
        <p data-tone="muted">{STRINGS.auth.loginBody}</p>
      </div>

      <FormField
        label={STRINGS.auth.emailLabel}
        name="email"
        type="email"
        value={email}
        placeholder={STRINGS.auth.emailPlaceholder}
        required
        disabled={submitting}
        onChange={(event) => setEmail(event.target.value)}
      />
      <FormField
        label={STRINGS.auth.passwordLabel}
        name="password"
        type="password"
        value={password}
        placeholder={STRINGS.auth.passwordPlaceholder}
        required
        disabled={submitting}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error ? <Notice message={error} tone="danger" /> : null}

      <Button
        type="submit"
        variant="primary"
        loading={submitting}
        loadingLabel={STRINGS.auth.loggingIn}
      >
        {STRINGS.auth.loginAction}
      </Button>

      <p className="auth-alt">
        <Link to={ROUTE_PATH.register}>{STRINGS.auth.toRegister}</Link>
      </p>
    </form>
  )
}
