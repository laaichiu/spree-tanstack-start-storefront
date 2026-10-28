import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountAuthFormView } from './account-auth-form-view'

afterEach(cleanup)

describe('AccountAuthFormView', () => {
  it('delegates form submission directly', () => {
    const onSubmit = vi.fn()

    render(
      <AccountAuthFormView onSubmit={onSubmit}>
        <button type="submit">Continue</button>
      </AccountAuthFormView>,
    )

    fireEvent.submit(screen.getByRole('button', { name: 'Continue' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
