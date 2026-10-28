import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutPaymentMethodListView } from './checkout-payment-method-list-view'

afterEach(cleanup)

describe('CheckoutPaymentMethodListView', () => {
  it('forwards the selected payment method and renders its body', () => {
    const onPaymentMethodChange = vi.fn()

    render(
      <CheckoutPaymentMethodListView
        capabilities={{
          renderPaymentMethodBody: (methodId) => <span>{methodId} form</span>,
        }}
        model={{
          disabled: false,
          methods: [
            {
              description: 'Pay securely by card',
              id: 'stripe_card',
              name: 'Card',
            },
            {
              description: 'Pay with your PayPal account',
              id: 'paypal',
              name: 'PayPal',
            },
          ],
          selectedPaymentMethodId: 'stripe_card',
        }}
        onPaymentMethodChange={onPaymentMethodChange}
      />,
    )

    expect(screen.getByText('stripe_card form')).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /PayPal/ }))

    expect(onPaymentMethodChange).toHaveBeenCalledWith('paypal')
  })
})
