import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountAddressCardView } from './account-address-card-view'

afterEach(cleanup)

describe('AccountAddressCardView', () => {
  it('delegates edit and delete directly to their callbacks', () => {
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <AccountAddressCardView
        model={{
          address: {
            fullName: 'Jane Doe',
            id: 'address_123',
            isDefaultBilling: false,
            isDefaultShipping: true,
            lines: ['123 Main Street', 'New York, NY 10001'],
          },
          isDeleting: false,
          labels: {
            defaultBilling: 'Default billing',
            defaultShipping: 'Default shipping',
            edit: 'Edit',
            notProvided: 'Not provided',
            remove: 'Remove',
            removing: 'Removing',
          },
        }}
        onDelete={onDelete}
        onEdit={onEdit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
