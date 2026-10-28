import type { Stripe, StripeElements } from '@stripe/stripe-js'
import { describe, expect, it, vi } from 'vitest'

import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { ExpressCheckoutPaymentActions } from './express-checkout-actions'
import { runExpressCheckoutPayment } from './express-checkout-payment-flow'

const server = vi.hoisted(() => ({
  preparePayment: vi.fn(),
}))

vi.mock('./express-checkout-payment-preparation', () => ({
  prepareExpressCheckoutPayment: server.preparePayment,
}))

const stripeMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm_method',
  name: 'Card',
  sessionRequired: true,
  type: 'card',
} as CheckoutPaymentMethod

describe('Express checkout payment completion', () => {
  it('navigates with the completed Order resource identity', async () => {
    const redirectToOrderPlaced = vi.fn().mockResolvedValue(undefined)
    const actions = {
      completeOrder: vi.fn().mockResolvedValue({
        order: {
          id: 'cart_123',
          orderResourceId: 'or_123',
        },
        success: true,
      }),
      completePaymentSession: vi.fn().mockResolvedValue({
        status: 'completed',
      }),
    } as unknown as ExpressCheckoutPaymentActions

    server.preparePayment.mockResolvedValue({
      clientSecret: 'secret',
      paymentMethodId: 'pm_card',
      selectedShippingRate: null,
      session: { id: 'ps_123' },
      success: true,
    })

    await runExpressCheckoutPayment({
      actions,
      cartId: 'cart_123',
      elements: {} as StripeElements,
      event: { paymentFailed: vi.fn() } as never,
      isConfirmingRef: { current: false },
      market: { country: 'us', locale: 'en' },
      redirectToConfirmation: vi.fn().mockResolvedValue(undefined),
      redirectToOrderPlaced,
      setError: vi.fn(),
      setProcessing: vi.fn(),
      stripe: {
        confirmPayment: vi.fn().mockResolvedValue({}),
      } as unknown as Stripe,
      stripeMethod,
      t: (key) => key,
    })

    expect(redirectToOrderPlaced).toHaveBeenCalledWith('or_123')
  })
})
