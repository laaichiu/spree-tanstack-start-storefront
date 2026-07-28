import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { render } from '@testing-library/react'

import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/model/checkout'

import {
  CheckoutExpressCheckout,
  getCheckoutExpressCheckoutState,
} from './checkout-express-checkout'

function checkoutOrder(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    amountDue: {
      amount: 42,
      currencyCode: 'USD',
    },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: [],
    currencyCode: 'USD',
    currentStep: 'payment',
    deliveryTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    discountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    email: null,
    id: 'cart_123',
    itemCount: 1,
    items: [],
    itemTotal: {
      amount: 42,
      currencyCode: 'USD',
    },
    paymentMethods: [stripeSessionPaymentMethod],
    requirements: [],
    shippingAddress: null,
    shippingMatchesBillingAddress: true,
    shippingRates: [],
    shippingDiscountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    taxTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    total: {
      amount: 42,
      currencyCode: 'USD',
    },
    ...overrides,
  }
}

const stripeSessionPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

describe('checkout express checkout state', () => {
  it('hides express checkout when no payment is due', () => {
    expect(
      getCheckoutExpressCheckoutState({
        amountDue: 0,
        hasWalletAction: true,
        paymentMethods: [stripeSessionPaymentMethod],
        stripeConfigured: true,
      }),
    ).toEqual({
      reason: 'no_payment_due',
      status: 'hidden',
    })
  })

  it('disables express checkout when Stripe is not configured', () => {
    expect(
      getCheckoutExpressCheckoutState({
        amountDue: 42,
        hasWalletAction: true,
        paymentMethods: [stripeSessionPaymentMethod],
        stripeConfigured: false,
      }),
    ).toEqual({
      reason: 'stripe_not_configured',
      status: 'disabled',
    })
  })

  it('disables express checkout without a Spree Stripe session payment method', () => {
    expect(
      getCheckoutExpressCheckoutState({
        amountDue: 42,
        hasWalletAction: true,
        paymentMethods: [
          {
            ...stripeSessionPaymentMethod,
            gatewayId: 'paypal',
            id: 'pm-paypal',
            type: 'SpreePaypalCheckout::Gateway',
          },
        ],
        stripeConfigured: true,
      }),
    ).toEqual({
      reason: 'stripe_payment_method_missing',
      status: 'disabled',
    })
  })

  it('marks express checkout ready only when wallet action is connected', () => {
    expect(
      getCheckoutExpressCheckoutState({
        amountDue: 42,
        hasWalletAction: false,
        paymentMethods: [stripeSessionPaymentMethod],
        stripeConfigured: true,
      }),
    ).toEqual({
      reason: 'wallet_action_missing',
      status: 'disabled',
    })

    expect(
      getCheckoutExpressCheckoutState({
        amountDue: 42,
        hasWalletAction: true,
        paymentMethods: [stripeSessionPaymentMethod],
        stripeConfigured: true,
      }),
    ).toEqual({
      reason: null,
      status: 'ready',
    })
  })
})

describe('CheckoutExpressCheckout', () => {
  it('does not mount Stripe wallet elements after the manual checkout path is active', () => {
    const { container } = render(
      createElement(CheckoutExpressCheckout, {
        cart: checkoutOrder(),
        enabled: false,
      }),
    )

    expect(container.textContent).toBe('')
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('hides unavailable wallet buttons instead of rendering a disabled placeholder', () => {
    const { container, queryByText } = render(
      createElement(CheckoutExpressCheckout, {
        cart: checkoutOrder({
          paymentMethods: [],
        }),
      }),
    )

    expect(container.textContent).toBe('')
    expect(container.querySelector('iframe')).toBeNull()
    expect(queryByText(/pay with link/i)).toBeNull()
  })
})
