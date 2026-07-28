import { describe, expect, it } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import { getCheckoutRenderedPaymentSubmitAction } from './checkout-payment-submit-result'

const fallbackMessage = 'Payment form is not ready.'

function checkoutOrder(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    amountDue: {
      amount: 10,
      currencyCode: 'USD',
    },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: ['address', 'delivery'],
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
    id: 'order_123',
    items: [],
    itemCount: 1,
    itemTotal: {
      amount: 10,
      currencyCode: 'USD',
    },
    number: 'R123456789',
    paymentMethods: [],
    requirements: [],
    shippingAddress: null,
    shippingMatchesBillingAddress: true,
    shippingDiscountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    shippingRates: [],
    taxTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    total: {
      amount: 10,
      currencyCode: 'USD',
    },
    ...overrides,
  }
}

describe('checkout rendered payment submit result helpers', () => {
  it('shows a fallback error when the payment section did not return a result', () => {
    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: fallbackMessage,
        result: undefined,
      }),
    ).toEqual({
      message: fallbackMessage,
      type: 'show_payment_error',
    })
  })

  it('shows returned payment errors unless the payment element already displayed them', () => {
    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: fallbackMessage,
        result: {
          error: 'Card was declined.',
        },
      }),
    ).toEqual({
      message: 'Card was declined.',
      type: 'show_payment_error',
    })

    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: fallbackMessage,
        result: {
          displayError: false,
          error: 'Card was declined.',
        },
      }),
    ).toEqual({
      type: 'ignore_error',
    })
  })

  it('routes confirmable sessions through confirm-payment', () => {
    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: fallbackMessage,
        result: {
          confirmPaymentSessionId: 'ps_123',
        },
      }),
    ).toEqual({
      type: 'confirm_payment',
    })
  })

  it('routes completed payment results to order placed', () => {
    const order = checkoutOrder({ id: 'order_placed_123' })

    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: fallbackMessage,
        result: {
          order,
        },
      }),
    ).toEqual({
      order,
      orderId: 'order_placed_123',
      type: 'order_placed',
    })
  })

  it('falls back to the cart id when a completed result has no mapped order', () => {
    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: fallbackMessage,
        result: {
          order: null,
        },
      }),
    ).toEqual({
      order: null,
      orderId: 'cart_123',
      type: 'order_placed',
    })
  })
})
