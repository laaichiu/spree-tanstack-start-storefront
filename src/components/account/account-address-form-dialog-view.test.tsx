import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountAddressFormDialogView } from './account-address-form-dialog-view'

afterEach(cleanup)

describe('AccountAddressFormDialogView', () => {
  it('delegates close and submit directly to their callbacks', () => {
    const onOpenChange = vi.fn()
    const onSubmit = vi.fn()
    render(
      <AccountAddressFormDialogView
        model={{
          cancelLabel: 'Cancel',
          closeLabel: 'Close',
          description: 'Add an address.',
          isPending: false,
          open: true,
          saveLabel: 'Save address',
          savingLabel: 'Saving address',
          title: 'Add address',
        }}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      >
        <input aria-label="Street" />
      </AccountAddressFormDialogView>,
    )

    expect(screen.getByLabelText('Street')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.submit(
      screen
        .getByRole('dialog', { name: 'Add address' })
        .querySelector('form')!,
    )

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
