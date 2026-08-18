import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { STRINGS } from '../../constants'
import { renderWithStore } from '../../test/utils'
import { ContactForm } from './ContactForm'

afterEach(() => vi.unstubAllGlobals())

const CONFIRMATION = 'Đã nhận thông tin.'

describe('ContactForm', () => {
  it('submits the enquiry and shows the confirmation the API returned', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ data: { message: CONFIRMATION } }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithStore(<ContactForm preselectedRoom={null} />)

    await userEvent.type(screen.getByLabelText(STRINGS.lead.nameLabel), 'Khach')
    await userEvent.type(screen.getByLabelText(STRINGS.lead.phoneLabel), '0900000000')
    await userEvent.click(
      screen.getByRole('button', { name: STRINGS.lead.submitAction }),
    )

    await waitFor(() => expect(screen.getByText(CONFIRMATION)).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('surfaces the backend message when the submission fails', async () => {
    const message = 'Số điện thoại không hợp lệ'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ error: { code: 'BAD_REQUEST', message } }, { status: 400 }),
      ),
    )

    renderWithStore(<ContactForm preselectedRoom={null} />)

    await userEvent.type(screen.getByLabelText(STRINGS.lead.nameLabel), 'Khach')
    await userEvent.type(screen.getByLabelText(STRINGS.lead.phoneLabel), '0900000000')
    await userEvent.click(
      screen.getByRole('button', { name: STRINGS.lead.submitAction }),
    )

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument())
  })
})
