// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { selectCheckoutShippingRateInputSchema } from './checkout-shipping.schemas'

const market = { country: 'us', locale: 'en' }

describe('checkout shipping input schema', () => {
  it('requires a Cart resource id before shipping selection', () => {
    expect(
      selectCheckoutShippingRateInputSchema.parse({
        cartId: 'cart_123',
        deliveryRateId: 'rate_123',
        fulfillmentId: 'fulfillment_123',
        market,
      }).cartId,
    ).toBe('cart_123')

    for (const cartId of ['', 'cart_', 'or_123', 'ps_123', 'cart-current']) {
      expect(() =>
        selectCheckoutShippingRateInputSchema.parse({
          cartId,
          deliveryRateId: 'rate_123',
          fulfillmentId: 'fulfillment_123',
          market,
        }),
      ).toThrow()
    }
  })
})
