import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountPaymentMethodCardView } from './account-payment-method-card-view'

afterEach(cleanup)

describe('AccountPaymentMethodCardView', () => {
  it('delegates deletion directly to the callback', () => {
    const onDelete = vi.fn()

    render(
      <AccountPaymentMethodCardView
        model={{
          card: {
            brandLabel: 'Visa',
            default: false,
            expiryLabel: '12/30',
            id: 'card_123',
            last4: '4242',
          },
          isPending: false,
          labels: {
            cardEndingIn: 'ending in',
            cardExpires: 'Expires',
            defaultPaymentMethod: 'Default',
            remove: 'Remove',
            removing: 'Removing',
          },
        }}
        onDelete={onDelete}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
