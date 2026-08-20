import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ROUTE_PATH, STRINGS } from '../../constants'
import { makeStore, renderWithStore } from '../../test/utils'
import { TenantNav } from './TenantNav'

function renderNav(path: string) {
  return renderWithStore(<TenantNav />, makeStore(), { initialEntries: [path] })
}

function tab(name: string) {
  return screen.getByRole('tab', { name })
}

describe('TenantNav', () => {
  it('selects the overview tab on the overview path', () => {
    renderNav(ROUTE_PATH.tenant)

    expect(tab(STRINGS.tenant.navOverview)).toHaveAttribute('aria-selected', 'true')
    expect(tab(STRINGS.tenant.navProfile)).toHaveAttribute('aria-selected', 'false')
  })

  it('selects the profile tab on the profile path', () => {
    renderNav(ROUTE_PATH.tenantProfile)

    expect(tab(STRINGS.tenant.navProfile)).toHaveAttribute('aria-selected', 'true')
    expect(tab(STRINGS.tenant.navOverview)).toHaveAttribute('aria-selected', 'false')
  })

  it('falls back to the overview tab on any other path', () => {
    renderNav(ROUTE_PATH.home)

    expect(tab(STRINGS.tenant.navOverview)).toHaveAttribute('aria-selected', 'true')
  })

  it('moves the selection after navigating to the profile', async () => {
    renderNav(ROUTE_PATH.tenant)

    await userEvent.click(tab(STRINGS.tenant.navProfile))

    expect(tab(STRINGS.tenant.navProfile)).toHaveAttribute('aria-selected', 'true')
  })
})
