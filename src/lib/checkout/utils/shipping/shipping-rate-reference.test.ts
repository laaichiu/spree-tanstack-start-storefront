import { describe, expect, it } from 'vitest'

import { serializeCheckoutShippingRateReference } from './shipping-rate-reference'

describe('checkout shipping rate reference helpers', () => {
  it('serializes only the server-owned shipping rate identity', () => {
    expect(
      serializeCheckoutShippingRateReference({
        deliveryMethodId: 'delivery_method_123',
        displayPrice: {
          amount: 8,
          currencyCode: 'USD',
        },
        fulfillmentId: 'fulfillment_123',
        id: 'rate_123',
        name: 'Express',
        price: {
          amount: 8,
          currencyCode: 'USD',
        },
        selected: true,
      }),
    ).toEqual({
      deliveryMethodId: 'delivery_method_123',
      fulfillmentId: 'fulfillment_123',
      id: 'rate_123',
    })
    expect(serializeCheckoutShippingRateReference(null)).toBeUndefined()
  })
})
