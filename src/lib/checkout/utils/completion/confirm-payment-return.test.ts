// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/contracts'

import { getConfirmPaymentResultNavigation } from './confirm-payment-return'

const completedCheckoutOrder = {
  id: 'cart_123',
  orderResourceId: 'or_123',
} as CheckoutOrder

describe('confirm payment return navigation', () => {
  it('uses the order resource identity after an order serializer fallback', () => {
    const navigation = getConfirmPaymentResultNavigation({
      cartId: 'cart_123',
      country: 'us',
      locale: 'en',
      result: {
        order: completedCheckoutOrder,
        success: true,
      },
    })

    expect(navigation).toMatchObject({
      kind: 'order_placed',
      params: {
        id: 'or_123',
      },
    })
  })
})
