// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/contracts'

import { getCheckoutRenderedPaymentSubmitAction } from './payment-submit-result'

describe('checkout payment submit result', () => {
  it('uses the order resource identity for order-placed navigation', () => {
    const order = {
      id: 'cart_123',
      orderResourceId: 'or_123',
    } as CheckoutOrder

    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: 'Payment is not ready.',
        result: { order },
      }),
    ).toMatchObject({
      orderId: 'or_123',
      type: 'order_placed',
    })
  })

  it('preserves a payment-session identity for completion recovery', () => {
    expect(
      getCheckoutRenderedPaymentSubmitAction({
        cartId: 'cart_123',
        paymentFormNotReadyMessage: 'Payment is not ready.',
        result: { confirmPaymentSessionId: 'ps_123' },
      }),
    ).toEqual({
      sessionId: 'ps_123',
      type: 'confirm_payment',
    })
  })
})
