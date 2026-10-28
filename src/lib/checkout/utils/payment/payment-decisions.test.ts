// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

import { getCheckoutPaymentSessionInitializationDecision } from './payment-session-initialization-decision'
import { getCheckoutPaymentSubmitDecision } from './payment-submit-decision'

const paymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

describe('checkout payment decisions', () => {
  const initializationInput = {
    gatewayId: 'stripe',
    lastPaymentSessionKey: null,
    selectedSessionKey: 'cart_123:pm-stripe:stripe:session',
    sessionRequired: true,
    stripeConfigured: true,
  }

  it('resets sessions that are unnecessary, unsupported, or unconfigured', () => {
    expect(
      getCheckoutPaymentSessionInitializationDecision({
        ...initializationInput,
        sessionRequired: false,
      }),
    ).toEqual({ reason: 'not_required', type: 'reset' })
    expect(
      getCheckoutPaymentSessionInitializationDecision({
        ...initializationInput,
        gatewayId: 'paypal',
      }),
    ).toEqual({ reason: 'unsupported_gateway', type: 'reset' })
    expect(
      getCheckoutPaymentSessionInitializationDecision({
        ...initializationInput,
        stripeConfigured: false,
      }),
    ).toEqual({ reason: 'stripe_not_configured', type: 'reset' })
  })

  it('skips the current session key and initializes only a new eligible key', () => {
    expect(
      getCheckoutPaymentSessionInitializationDecision({
        ...initializationInput,
        lastPaymentSessionKey: initializationInput.selectedSessionKey,
      }),
    ).toEqual({ type: 'skip' })
    expect(
      getCheckoutPaymentSessionInitializationDecision(initializationInput),
    ).toEqual({ type: 'initialize' })
  })

  it('requires known amount and shipping before payment processing', () => {
    expect(getCheckoutPaymentSubmitDecision(null, null, true)).toBe(
      'checkout.paymentSessionNotReady',
    )
    expect(getCheckoutPaymentSubmitDecision(0, null, false)).toBe(
      'checkout.selectShippingBeforePayment',
    )
  })

  it('completes zero-total orders and requires a method for payable orders', () => {
    expect(getCheckoutPaymentSubmitDecision(0, null, true)).toBe('complete')
    expect(getCheckoutPaymentSubmitDecision(49.99, null, true)).toBe(
      'checkout.selectPaymentMethod',
    )
    expect(
      getCheckoutPaymentSubmitDecision(49.99, paymentMethod, true),
    ).toEqual(paymentMethod)
  })
})
