import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountDeleteAddressDialogView } from './account-delete-address-dialog-view'

afterEach(cleanup)

describe('AccountDeleteAddressDialogView', () => {
  it('delegates cancel-close and confirmation directly to their callbacks', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <AccountDeleteAddressDialogView
        model={{
          address: {
            fullName: 'Jane Doe',
            lines: ['123 Main Street', 'New York, NY 10001'],
          },
          cancelLabel: 'Cancel',
          closeLabel: 'Close',
          confirmLabel: 'Delete address',
          description: 'Remove this address?',
          isPending: false,
          removingLabel: 'Removing address',
          title: 'Delete address',
        }}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete address' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
