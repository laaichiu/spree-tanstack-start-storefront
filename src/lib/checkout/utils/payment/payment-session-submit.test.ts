// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

import { submitCheckoutPaymentSession } from './payment-session-submit'
import type { CheckoutPaymentSession } from './payment-session-contract'

const confirmCheckoutPaymentProvider = vi.hoisted(() => vi.fn())

vi.mock('./payment-provider-confirmation', () => ({
  confirmCheckoutPaymentProvider,
}))

const paymentSession: CheckoutPaymentSession = {
  id: 'ps_123',
  providerData: { clientSecret: 'pi_secret_123' },
  status: 'processing',
}

const paymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm_stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

describe('checkout payment-session submission', () => {
  it('preserves the session for confirm-payment recovery when order completion throws', async () => {
    confirmCheckoutPaymentProvider.mockResolvedValue({ type: 'success' })

    const completePaymentSession = vi.fn().mockResolvedValue({
      ...paymentSession,
      status: 'completed',
    })
    const finishCheckoutOrder = vi
      .fn()
      .mockRejectedValue(new Error('order completion unavailable'))

    await expect(
      submitCheckoutPaymentSession({
        cartId: 'cart_123',
        clientSecret: 'pi_secret_123',
        completePaymentSession,
        finishCheckoutOrder,
        isStripeElementReady: true,
        market: { country: 'us', locale: 'en' },
        paymentSession,
        selectedPaymentMethod: paymentMethod,
        selectedSavedPaymentProfileIdForSession: null,
        selectedShippingRate: null,
        setPaymentError: vi.fn(),
        stripePaymentHandle: {
          confirmPayment: vi.fn().mockResolvedValue({}),
        },
        t: () => 'message',
      }),
    ).resolves.toEqual({ confirmPaymentSessionId: 'ps_123' })

    expect(completePaymentSession).toHaveBeenCalledOnce()
    expect(finishCheckoutOrder).toHaveBeenCalledOnce()
  })
})
