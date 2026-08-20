import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ROUTE_PATH, STRINGS, USER_ROLE } from '../../constants'
import { fetchMe } from '../../store/slices/authSlice'
import { makeStore, renderWithStore } from '../../test/utils'
import type { User } from '../../types/models'
import { AdminSidebar } from './AdminSidebar'

function makeUser(role: string): User {
  return {
    id: 'user-1',
    username: 'operator',
    email: 'operator@example.com',
    role,
    email_verified: true,
    phone: null,
    contract_id: null,
    created_at: '2026-01-01T00:00:00',
  }
}

/**
 * The slice has no plain setter for the signed-in user, so the session is
 * seeded through the same action `fetchMe` dispatches on a page reload.
 */
function renderSidebar(role: string = USER_ROLE.admin) {
  const store = makeStore()
  store.dispatch(fetchMe.fulfilled(makeUser(role), '', undefined))
  return renderWithStore(<AdminSidebar />, store, { initialEntries: [ROUTE_PATH.admin] })
}

/** The open/closed state lives on the aside, which CSS reads below 860px. */
function sidebar(): HTMLElement {
  return document.querySelector('.admin-sidebar') as HTMLElement
}

function toggle() {
  return screen.getByRole('button', { name: STRINGS.nav.menu })
}

/*
 * jsdom does not evaluate media queries, so nothing here can assert that the
 * nav is actually hidden on a phone — only the attributes and the DOM the CSS
 * keys off are testable.
 */
describe('AdminSidebar menu toggle', () => {
  it('starts closed', () => {
    renderSidebar()

    expect(sidebar()).toHaveAttribute('data-menu-open', String(false))
    expect(toggle()).toHaveAttribute('aria-expanded', String(false))
  })

  it('opens the nav when the menu button is pressed', async () => {
    renderSidebar()

    await userEvent.click(toggle())

    expect(sidebar()).toHaveAttribute('data-menu-open', String(true))
    expect(toggle()).toHaveAttribute('aria-expanded', String(true))
  })

  it('closes again on a second press rather than only ever opening', async () => {
    renderSidebar()

    await userEvent.click(toggle())
    await userEvent.click(toggle())

    expect(sidebar()).toHaveAttribute('data-menu-open', String(false))
    expect(toggle()).toHaveAttribute('aria-expanded', String(false))
  })

  it('closes when a navigation link is followed, so the panel stops covering the page', async () => {
    renderSidebar()

    await userEvent.click(toggle())
    await userEvent.click(screen.getByRole('link', { name: STRINGS.nav.rooms }))

    expect(sidebar()).toHaveAttribute('data-menu-open', String(false))
    expect(toggle()).toHaveAttribute('aria-expanded', String(false))
  })

  it('points the toggle at the nav it controls', () => {
    renderSidebar()

    const controls = toggle().getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    expect(screen.getByRole('navigation')).toHaveAttribute('id', controls as string)
  })
})

describe('AdminSidebar role visibility', () => {
  it('offers account administration to an admin', () => {
    renderSidebar(USER_ROLE.admin)

    expect(screen.getByRole('link', { name: STRINGS.nav.users })).toBeInTheDocument()
  })

  it('hides account administration from a manager', () => {
    renderSidebar(USER_ROLE.manager)

    expect(screen.queryByRole('link', { name: STRINGS.nav.users })).toBeNull()
    // The rest of the rail is still there, so the absence is scoped.
    expect(screen.getByRole('link', { name: STRINGS.nav.rooms })).toBeInTheDocument()
  })
})
