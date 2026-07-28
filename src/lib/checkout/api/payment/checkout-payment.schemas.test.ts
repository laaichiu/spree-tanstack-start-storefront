import { describe, expect, it } from 'vitest'

import {
  checkoutExternalDataSchema,
  createCheckoutPaymentSessionInputSchema,
} from './checkout-payment.schemas'

const market = {
  country: 'us',
  locale: 'en',
}

describe('checkout payment input schemas', () => {
  it('allows only supported provider fields', () => {
    expect(
      checkoutExternalDataSchema.parse({
        stripe_payment_method_id: 'pm_123',
      }),
    ).toEqual({
      stripe_payment_method_id: 'pm_123',
    })

    expect(() =>
      checkoutExternalDataSchema.parse({
        client_secret: 'pi_secret',
      }),
    ).toThrow()
  })

  it('rejects unsupported provider fields and invalid saved payment methods', () => {
    expect(() =>
      checkoutExternalDataSchema.parse({
        return_url: 'https://attacker.example/return',
      }),
    ).toThrow()

    expect(() =>
      checkoutExternalDataSchema.parse({
        stripe_payment_method_id: 'cus_other_customer',
      }),
    ).toThrow()
  })

  it('rejects client-supplied shipping price and display fields', () => {
    expect(() =>
      createCheckoutPaymentSessionInputSchema.parse({
        cartId: 'cart_123',
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate: {
          displayPrice: { amount: 0, currencyCode: 'USD' },
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
          name: 'Free shipping',
          price: { amount: 0, currencyCode: 'USD' },
        },
      }),
    ).toThrow()
  })
})
