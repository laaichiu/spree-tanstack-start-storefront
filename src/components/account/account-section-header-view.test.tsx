import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountSectionHeaderView } from './account-section-header-view'

afterEach(cleanup)

describe('AccountSectionHeaderView', () => {
  it('delegates sign out directly and reflects the pending state', () => {
    const onSignOut = vi.fn()

    render(
      <AccountSectionHeaderView
        model={{
          email: 'jane@example.com',
          isSigningOut: false,
          label: 'Account',
          labels: { signOut: 'Sign out', signingOut: 'Signing out' },
          title: 'Jane',
        }}
        onSignOut={onSignOut}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
