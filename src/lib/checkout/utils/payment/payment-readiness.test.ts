import { describe, expect, it } from 'vitest'

import type { CheckoutPaymentMethod } from '../../model/checkout'

import {
  getCheckoutPaymentReadiness,
  getCheckoutSubmitReadiness,
} from './payment-readiness'

function paymentMethod(
  overrides: Partial<CheckoutPaymentMethod> = {},
): CheckoutPaymentMethod {
  return {
    description: null,
    gatewayId: 'stripe',
    id: 'pm-stripe',
    name: 'Stripe',
    sessionRequired: true,
    type: 'SpreeStripe::Gateway',
    ...overrides,
  }
}

describe('checkout payment readiness', () => {
  it('allows the payment form to become ready before shipping is selected', () => {
    expect(
      getCheckoutPaymentReadiness({
        clientSecretAvailable: true,
        isBusy: false,
        orderTotalAmount: 49.99,
        paymentSessionAvailable: true,
        selectedPaymentMethod: paymentMethod(),
        stripeConfigured: true,
        stripeElementComplete: true,
        stripeElementReady: true,
      }),
    ).toEqual({
      ready: true,
      reason: null,
    })
  })

  it('allows free orders without a payment method', () => {
    expect(
      getCheckoutPaymentReadiness({
        clientSecretAvailable: false,
        isBusy: false,
        orderTotalAmount: 0,
        paymentSessionAvailable: false,
        selectedPaymentMethod: null,
        stripeConfigured: false,
        stripeElementComplete: false,
        stripeElementReady: false,
      }),
    ).toEqual({
      ready: true,
      reason: null,
    })
  })

  it('allows direct payment methods without a provider session', () => {
    expect(
      getCheckoutPaymentReadiness({
        clientSecretAvailable: false,
        isBusy: false,
        orderTotalAmount: 49.99,
        paymentSessionAvailable: false,
        selectedPaymentMethod: paymentMethod({
          gatewayId: 'unknown',
          sessionRequired: false,
          type: 'Spree::PaymentMethod::Check',
        }),
        stripeConfigured: false,
        stripeElementComplete: false,
        stripeElementReady: false,
      }),
    ).toEqual({
      ready: true,
      reason: null,
    })
  })

  it('requires a complete Stripe Payment Element for session payments', () => {
    expect(
      getCheckoutPaymentReadiness({
        clientSecretAvailable: true,
        isBusy: false,
        orderTotalAmount: 49.99,
        paymentSessionAvailable: true,
        selectedPaymentMethod: paymentMethod(),
        stripeConfigured: true,
        stripeElementComplete: false,
        stripeElementReady: true,
      }),
    ).toEqual({
      ready: false,
      reason: 'payment_form_incomplete',
    })

    expect(
      getCheckoutPaymentReadiness({
        clientSecretAvailable: true,
        isBusy: false,
        orderTotalAmount: 49.99,
        paymentSessionAvailable: true,
        selectedPaymentMethod: paymentMethod(),
        stripeConfigured: true,
        stripeElementComplete: true,
        stripeElementReady: true,
      }),
    ).toEqual({
      ready: true,
      reason: null,
    })
  })

  it('allows a checkout-capable saved Stripe card without a Payment Element', () => {
    expect(
      getCheckoutPaymentReadiness({
        clientSecretAvailable: true,
        isBusy: false,
        orderTotalAmount: 49.99,
        paymentSessionAvailable: true,
        savedPaymentMethodAvailable: true,
        selectedPaymentMethod: paymentMethod(),
        stripeConfigured: true,
        stripeElementComplete: false,
        stripeElementReady: false,
      }),
    ).toEqual({
      ready: true,
      reason: null,
    })
  })

  it('reports unsupported session gateways before the form can submit', () => {
    expect(
      getCheckoutPaymentReadiness({
        clientSecretAvailable: false,
        isBusy: false,
        orderTotalAmount: 49.99,
        paymentSessionAvailable: false,
        selectedPaymentMethod: paymentMethod({
          gatewayId: 'adyen',
          id: 'pm-adyen',
          type: 'SpreeAdyen::Gateway',
        }),
        stripeConfigured: true,
        stripeElementComplete: false,
        stripeElementReady: false,
      }),
    ).toEqual({
      ready: false,
      reason: 'unsupported_session_payment',
    })
  })
})

describe('checkout submit readiness', () => {
  it('allows the final submit to trigger validation before shipping or payment are ready', () => {
    expect(
      getCheckoutSubmitReadiness({
        isCheckoutPending: false,
        isCheckoutSubmitting: false,
        isPaymentBusy: false,
        isPaymentSubmitQueued: false,
      }),
    ).toEqual({
      ready: true,
      reason: null,
    })
  })

  it('blocks submit while checkout or payment work is active', () => {
    expect(
      getCheckoutSubmitReadiness({
        isCheckoutPending: true,
        isCheckoutSubmitting: false,
        isPaymentBusy: false,
        isPaymentSubmitQueued: false,
      }),
    ).toEqual({
      ready: false,
      reason: 'checkout_pending',
    })

    expect(
      getCheckoutSubmitReadiness({
        isCheckoutPending: false,
        isCheckoutSubmitting: false,
        isPaymentBusy: true,
        isPaymentSubmitQueued: false,
      }),
    ).toEqual({
      ready: false,
      reason: 'payment_busy',
    })
  })

  it('blocks submit while a refreshed payment submit is queued', () => {
    expect(
      getCheckoutSubmitReadiness({
        isCheckoutPending: false,
        isCheckoutSubmitting: false,
        isPaymentBusy: false,
        isPaymentSubmitQueued: true,
      }),
    ).toEqual({
      ready: false,
      reason: 'payment_submit_queued',
    })
  })
})
