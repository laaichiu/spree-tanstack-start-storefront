import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountAddressesSectionView } from './account-addresses-section-view'

const labels = {
  addAddress: 'Add address',
  addresses: 'Addresses',
  addressesDescription: 'Manage your addresses.',
  addressesLoadFailed: 'Unable to load addresses',
  addressesLoadFailedDescription: 'Try again later.',
  noAddresses: 'No addresses',
  noAddressesDescription: 'Add an address to get started.',
}

afterEach(cleanup)

describe('AccountAddressesSectionView', () => {
  it('delegates section actions directly and binds address ids', () => {
    const onAdd = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <AccountAddressesSectionView
        model={{
          addresses: [
            {
              address: {
                fullName: 'Jane Doe',
                id: 'address_123',
                isDefaultBilling: false,
                isDefaultShipping: true,
                lines: ['123 Main Street'],
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
            },
          ],
          labels,
          status: 'ready',
        }}
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
        dialogs={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add address' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith('address_123')
    expect(onDelete).toHaveBeenCalledWith('address_123')
  })

  it('shows the empty state, mutation error, and add action together', () => {
    const onAdd = vi.fn()

    render(
      <AccountAddressesSectionView
        model={{
          addresses: [],
          errorMessage: 'Save failed',
          labels,
          status: 'ready',
        }}
        onAdd={onAdd}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        dialogs={<p>Address dialog</p>}
      />,
    )

    expect(screen.getByText('No addresses')).toBeTruthy()
    expect(screen.getByText('Save failed')).toBeTruthy()
    expect(screen.getByText('Address dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Add address' }))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('shows a load failure without add actions or dialogs', () => {
    render(
      <AccountAddressesSectionView
        model={{ labels, status: 'load-error' }}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        dialogs={<p>Address dialog</p>}
      />,
    )

    expect(screen.getByText('Unable to load addresses')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add address' })).toBeNull()
    expect(screen.queryByText('Address dialog')).toBeNull()
  })
})
