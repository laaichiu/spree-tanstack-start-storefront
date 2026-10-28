// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  completedCheckoutOrderInputSchema,
  confirmCheckoutPaymentInputSchema,
} from './checkout-completion.schemas'

const market = { country: 'us', locale: 'en' }

describe('confirm checkout payment input schema', () => {
  it('accepts a PaymentSession resource id', () => {
    expect(
      confirmCheckoutPaymentInputSchema.parse({
        cartId: 'cart_123',
        market,
        sessionId: 'ps_123',
      }).sessionId,
    ).toBe('ps_123')
  })

  it.each(['cart_123', 'or_123', 'ps_'])(
    'rejects a non-PaymentSession id: %s',
    (sessionId) => {
      expect(() =>
        confirmCheckoutPaymentInputSchema.parse({
          cartId: 'cart_123',
          market,
          sessionId,
        }),
      ).toThrow()
    },
  )

  it('keeps the provider-specific Adyen session id independent', () => {
    expect(
      confirmCheckoutPaymentInputSchema.parse({
        adyenSessionId: 'adyen-session',
        cartId: 'cart_123',
        market,
      }).adyenSessionId,
    ).toBe('adyen-session')
  })
})

describe('completed checkout order input schema', () => {
  it.each(['cart_123', 'or_123', 'ogrp_123'])(
    'accepts a lookup id: %s',
    (orderId) => {
      expect(
        completedCheckoutOrderInputSchema.parse({ orderId, market }).orderId,
      ).toBe(orderId)
    },
  )

  it.each(['', 'cart_', 'or_', 'ogrp_', 'ps_123'])(
    'rejects a non-Cart/Order/OrderGroup lookup id: %s',
    (orderId) => {
      expect(() =>
        completedCheckoutOrderInputSchema.parse({ orderId, market }),
      ).toThrow()
    },
  )
})
