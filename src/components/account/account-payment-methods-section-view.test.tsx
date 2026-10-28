import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountPaymentMethodsSectionView } from './account-payment-methods-section-view'

afterEach(cleanup)

describe('AccountPaymentMethodsSectionView', () => {
  it('shows the load error without rendering payment methods', () => {
    render(
      <AccountPaymentMethodsSectionView
        model={{
          labels: {
            noPaymentMethods: 'No payment methods',
            noPaymentMethodsDescription: 'No saved payment methods.',
            paymentMethods: 'Payment methods',
            paymentMethodsDescription: 'Manage your saved cards.',
            paymentMethodsLoadFailed: 'Unable to load payment methods',
            paymentMethodsLoadFailedDescription: 'Try again later.',
            securePaymentMethodsDescription: 'Your payment details are secure.',
          },
          status: 'load-error',
        }}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('Unable to load payment methods')).toBeTruthy()
    expect(screen.queryByText('Payment methods')).toBeNull()
  })

  it('passes the selected card id to the direct delete callback', () => {
    const onDelete = vi.fn()

    render(
      <AccountPaymentMethodsSectionView
        model={{
          cards: [
            {
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
            },
          ],
          labels: {
            noPaymentMethods: 'No payment methods',
            noPaymentMethodsDescription: 'No saved payment methods.',
            paymentMethods: 'Payment methods',
            paymentMethodsDescription: 'Manage your saved cards.',
            paymentMethodsLoadFailed: 'Unable to load payment methods',
            paymentMethodsLoadFailedDescription: 'Try again later.',
            securePaymentMethodsDescription: 'Your payment details are secure.',
          },
          status: 'ready',
        }}
        onDelete={onDelete}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(onDelete).toHaveBeenCalledWith('card_123')
  })
})
