import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTE_PATH, SLICE, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { register } from '../../store/slices/authSlice'
import { Button } from '../atoms'
import { FormField, Notice } from '../molecules'

export function RegisterForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { submitting, error } = useAppSelector((state) => state[SLICE.auth])
  const [form, setForm] = useState({ username: '', email: '', password: '' })

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await dispatch(register(form))
    if (register.fulfilled.match(result)) {
      navigate(ROUTE_PATH.admin)
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <div>
        <h1>{STRINGS.auth.registerHeading}</h1>
        <p data-tone="muted">{STRINGS.auth.registerBody}</p>
      </div>

      <FormField
        label={STRINGS.auth.usernameLabel}
        name="username"
        value={form.username}
        placeholder={STRINGS.auth.usernamePlaceholder}
        required
        disabled={submitting}
        onChange={(event) => update('username', event.target.value)}
      />
      <FormField
        label={STRINGS.auth.emailLabel}
        name="email"
        type="email"
        value={form.email}
        placeholder={STRINGS.auth.emailPlaceholder}
        required
        disabled={submitting}
        onChange={(event) => update('email', event.target.value)}
      />
      <FormField
        label={STRINGS.auth.passwordLabel}
        name="password"
        type="password"
        value={form.password}
        placeholder={STRINGS.auth.passwordPlaceholder}
        required
        disabled={submitting}
        onChange={(event) => update('password', event.target.value)}
      />

      {error ? <Notice message={error} tone="danger" /> : null}

      <Button
        type="submit"
        variant="primary"
        loading={submitting}
        loadingLabel={STRINGS.auth.registering}
      >
        {STRINGS.auth.registerAction}
      </Button>

      <p className="auth-alt">
        <Link to={ROUTE_PATH.login}>{STRINGS.auth.toLogin}</Link>
      </p>
    </form>
  )
}
