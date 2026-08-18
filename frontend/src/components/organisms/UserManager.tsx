import { useEffect } from 'react'

import { SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { deleteUser, fetchUsers, updateUser } from '../../store/slices/usersSlice'
import type { User } from '../../types/models'
import { formatDate } from '../../utils/format'
import { ROLE_OPTIONS } from '../../utils/labels'
import { Button, Select, Spinner } from '../atoms'
import { EmptyState, Notice, StatusBadge } from '../molecules'

export function UserManager() {
  const dispatch = useAppDispatch()
  const { entities, status, pendingIds, error } = useAppSelector((state) => state[SLICE.users])
  const currentUser = useAppSelector((state) => state[SLICE.auth].user)

  useEffect(() => {
    void dispatch(fetchUsers())
  }, [dispatch])

  async function onDelete(user: User) {
    if (window.confirm(STRINGS.user.deleteConfirm)) {
      await dispatch(deleteUser(user.id))
    }
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.user.heading}</h2>
      </div>

      {error ? <Notice message={error} tone="danger" /> : null}
      {status === STATUS.loading ? <Spinner label={STRINGS.common.loading} /> : null}

      {status === STATUS.succeeded && entities.length === 0 ? (
        <EmptyState message={STRINGS.user.empty} />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{STRINGS.user.usernameLabel}</th>
                <th>{STRINGS.user.emailLabel}</th>
                <th>{STRINGS.user.roleLabel}</th>
                <th>{STRINGS.user.verifiedLabel}</th>
                <th>{STRINGS.user.createdLabel}</th>
                <th>{STRINGS.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((user) => {
                const pending = pendingIds.includes(user.id)
                const isSelf = user.id === currentUser?.id
                return (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <Select
                        value={user.role}
                        disabled={pending || isSelf}
                        aria-label={`${STRINGS.user.roleLabel} ${user.username}`}
                        onChange={(event) =>
                          void dispatch(
                            updateUser({ id: user.id, payload: { role: event.target.value } }),
                          )
                        }
                      >
                        {ROLE_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <StatusBadge
                        label={
                          user.email_verified ? STRINGS.user.verified : STRINGS.user.unverified
                        }
                        tone={user.email_verified ? 'positive' : 'warning'}
                      />
                    </td>
                    <td className="num">{formatDate(user.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <Button
                          size="sm"
                          variant="danger"
                          /* An admin must not lock themselves out of the CMS. */
                          disabled={pending || isSelf}
                          onClick={() => void onDelete(user)}
                        >
                          {STRINGS.common.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
