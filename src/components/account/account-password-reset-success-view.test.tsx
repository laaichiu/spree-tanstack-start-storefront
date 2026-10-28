import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AccountPasswordResetSuccessView } from './account-password-reset-success-view'

afterEach(cleanup)

describe('AccountPasswordResetSuccessView', () => {
  it('renders the sign-in link directly', () => {
    render(
      <AccountPasswordResetSuccessView
        description="Your password has been reset."
        signInLink={<a href="/account/login">Sign in</a>}
      />,
    )

    expect(screen.getByText('Your password has been reset.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveProperty(
      'pathname',
      '/account/login',
    )
  })
})
