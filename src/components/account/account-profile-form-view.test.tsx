import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountProfileFormView } from './account-profile-form-view'

afterEach(cleanup)

describe('AccountProfileFormView', () => {
  it('delegates form submission directly to the callback', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <AccountProfileFormView
        model={{
          description: 'Update your profile.',
          isDirty: true,
          isPending: false,
          saveLabel: 'Save profile',
          savingLabel: 'Saving profile',
          title: 'Profile',
        }}
        onSubmit={onSubmit}
        fields={{
          email: { label: 'Email' },
          firstName: { label: 'First name' },
          lastName: { label: 'Last name' },
          marketing: {
            checked: false,
            label: 'Marketing emails',
            onChange: vi.fn(),
          },
          phone: { label: 'Phone' },
        }}
      />,
    )

    fireEvent.submit(container.querySelector('form')!)

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
