// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  checkoutPaymentSessionInputDataSchema,
  completeCheckoutPaymentSessionInputSchema,
  createCheckoutPaymentSessionInputSchema,
} from './checkout-payment.schemas'

const market = { country: 'us', locale: 'en' }

describe('checkout payment input schemas', () => {
  it('accepts guest and saved-card session initialization with minimal input', () => {
    expect(
      createCheckoutPaymentSessionInputSchema.parse({
        cartId: 'cart_123',
        market,
        paymentData: {},
        paymentMethodId: 'pm_123',
        selectedShippingRate: undefined,
      }).paymentData,
    ).toEqual({})
    expect(
      checkoutPaymentSessionInputDataSchema.parse({
        stripePaymentMethodId: 'pm_saved',
      }),
    ).toEqual({ stripePaymentMethodId: 'pm_saved' })
  })

  it.each([
    { client_secret: 'pi_secret' },
    { return_url: 'https://attacker.example/return' },
    { stripePaymentMethodId: 'cust_other_customer' },
  ])('rejects unsupported provider data: %o', (paymentData) => {
    expect(() =>
      checkoutPaymentSessionInputDataSchema.parse(paymentData),
    ).toThrow()
  })

  it('rejects client-supplied shipping display and price fields', () => {
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

  it('keeps arbitrary provider input out of session creation and completion', () => {
    expect(() =>
      createCheckoutPaymentSessionInputSchema.parse({
        cartId: 'cart_123',
        externalData: { stripePaymentMethodId: 'pm_saved' },
        market,
        paymentMethodId: 'pm_123',
      }),
    ).toThrow()
    expect(() =>
      completeCheckoutPaymentSessionInputSchema.parse({
        cartId: 'cart_123',
        externalData: { stripePaymentMethodId: 'pm_saved' },
        market,
        sessionId: 'ps_123',
      }),
    ).toThrow()
  })

  it.each(['cart_123', 'or_123', 'ps_'])(
    'requires a PaymentSession id: %s',
    (sessionId) => {
      expect(() =>
        completeCheckoutPaymentSessionInputSchema.parse({
          cartId: 'cart_123',
          market,
          sessionId,
        }),
      ).toThrow()
    },
  )
})
