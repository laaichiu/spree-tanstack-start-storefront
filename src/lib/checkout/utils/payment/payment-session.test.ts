// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

import {
  getCheckoutPaymentReturnUrl,
  getCheckoutPaymentSessionInputData,
  getCheckoutPaymentSessionKey,
  isCompletedPaymentSessionStatus,
  readSafePaymentSessionErrorMessage,
  readStripeClientSecret,
} from './payment-session'

const paymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

describe('checkout payment session contract', () => {
  it('reads only the normalized Stripe client secret', () => {
    expect(readStripeClientSecret({ clientSecret: 'pi_secret_123' })).toBe(
      'pi_secret_123',
    )
    expect(readStripeClientSecret({ clientSecret: null })).toBeUndefined()
  })

  it('builds a same-origin market-aware confirmation URL', () => {
    expect(
      getCheckoutPaymentReturnUrl({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        sessionId: 'ps_123',
      }),
    ).toBe(
      `${window.location.origin}/us/en/confirm-payment/cart_123?session=ps_123`,
    )
  })

  it('changes session identity when shipping, totals, or saved-card identity changes', () => {
    const order = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
    const market = { country: 'us', locale: 'en' }
    const initialKey = getCheckoutPaymentSessionKey({
      market,
      order,
      paymentMethod,
    })
    const savedCardKey = getCheckoutPaymentSessionKey({
      market,
      order,
      paymentMethod,
      savedPaymentMethodId: 'pm_saved',
    })
    const changedShippingKey = getCheckoutPaymentSessionKey({
      market,
      order: {
        ...order,
        shippingRates: order.shippingRates.map((rate) => ({
          ...rate,
          selected: rate.id === 'rate-2',
        })),
      },
      paymentMethod,
    })
    const changedMarketKey = getCheckoutPaymentSessionKey({
      market: { country: 'ca', locale: 'en' },
      order,
      paymentMethod,
    })

    expect(initialKey).not.toBe(savedCardKey)
    expect(initialKey).not.toBe(changedShippingKey)
    expect(initialKey).not.toBe(changedMarketKey)
    expect(initialKey).toContain('us:en:cart-1:pm-stripe:stripe:session:USD')
  })

  it('allowlists only a trimmed saved Stripe payment method id', () => {
    expect(
      getCheckoutPaymentSessionInputData({
        savedStripePaymentMethodId: ' pm_saved ',
      }),
    ).toEqual({ stripePaymentMethodId: 'pm_saved' })
    expect(
      getCheckoutPaymentSessionInputData({ savedStripePaymentMethodId: ' ' }),
    ).toEqual({})
  })

  it('allows order completion only for a completed payment session', () => {
    expect(isCompletedPaymentSessionStatus('completed')).toBe(true)
    expect(isCompletedPaymentSessionStatus(' COMPLETED ')).toBe(true)

    for (const status of [
      'canceled',
      'cancelled',
      'expired',
      'failed',
      'pending',
      'processing',
      'unknown',
      '',
    ]) {
      expect(isCompletedPaymentSessionStatus(status)).toBe(false)
    }

    for (const status of [undefined, null, 42, { status: 'completed' }]) {
      expect(isCompletedPaymentSessionStatus(status)).toBe(false)
    }
  })

  it('hides provider configuration details, secrets, and internal object ids', () => {
    const fallback = 'Payment session could not be initialized.'

    expect(
      readSafePaymentSessionErrorMessage(
        new Error('Expired API Key provided: sk_test_123456789abcdef'),
        fallback,
      ),
    ).toBe(fallback)
    expect(
      readSafePaymentSessionErrorMessage(
        new Error(
          'The PaymentMethod pm_saved does not belong to Customer cust_current.',
        ),
        fallback,
      ),
    ).toBe(fallback)
    expect(
      readSafePaymentSessionErrorMessage(
        'Payment declined for sk_test_123456789abcdef',
        'Payment failed.',
      ),
    ).toBe('Payment declined for sk_test_[redacted]')
  })
})
