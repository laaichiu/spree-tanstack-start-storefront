import type {
  Stripe,
  StripeElements,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'
import { describe, expect, it, vi } from 'vitest'

import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

import type { ExpressCheckoutPaymentActions } from './express-checkout-actions'
import { runExpressCheckoutPayment } from './express-checkout-payment-flow'
import type { ExpressCheckoutPaymentPreparationResult } from './express-checkout-payment-preparation'

const preparePayment = vi.hoisted(() => vi.fn())

vi.mock('./express-checkout-payment-preparation', () => ({
  prepareExpressCheckoutPayment: preparePayment,
}))

const stripeMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm_method',
  name: 'Card',
  sessionRequired: true,
  type: 'card',
} as CheckoutPaymentMethod

const paymentSession = {
  id: 'ps_123',
  providerData: { clientSecret: 'secret' },
  status: 'processing' as const,
}

const preparation: ExpressCheckoutPaymentPreparationResult = {
  clientSecret: 'secret',
  paymentMethodId: 'pm_card',
  selectedShippingRate: null,
  session: paymentSession,
  success: true,
}

function createEvent() {
  return {
    paymentFailed: vi.fn(),
  } as unknown as StripeExpressCheckoutElementConfirmEvent
}

function createOptions(
  event: ReturnType<typeof createEvent>,
  isCurrent: () => boolean,
  overrides: Partial<Parameters<typeof runExpressCheckoutPayment>[0]> = {},
) {
  return {
    actions: {
      completeOrder: vi.fn().mockResolvedValue({ success: true }),
      completePaymentSession: vi.fn().mockResolvedValue({
        ...paymentSession,
        status: 'completed',
      }),
    } as unknown as ExpressCheckoutPaymentActions,
    cartId: 'cart_123',
    elements: {} as StripeElements,
    event,
    isConfirmingRef: { current: false },
    isCurrent,
    market: { country: 'us', locale: 'en' },
    redirectToConfirmation: vi.fn().mockResolvedValue(undefined),
    redirectToOrderPlaced: vi.fn().mockResolvedValue(undefined),
    setError: vi.fn(),
    setProcessing: vi.fn(),
    stripe: {
      confirmPayment: vi.fn().mockResolvedValue({}),
    } as unknown as Stripe,
    stripeMethod,
    t: (key: string) => key,
    ...overrides,
  }
}

describe('Express checkout payment lifecycle', () => {
  it('stops before provider confirmation when preparation becomes stale', async () => {
    let resolvePreparation: (
      result: ExpressCheckoutPaymentPreparationResult,
    ) => void = () => undefined
    preparePayment.mockReturnValueOnce(
      new Promise<ExpressCheckoutPaymentPreparationResult>((resolve) => {
        resolvePreparation = resolve
      }),
    )
    let current = true
    const event = createEvent()
    const options = createOptions(event, () => current)
    const confirmation = runExpressCheckoutPayment(options)

    current = false
    resolvePreparation(preparation)
    await confirmation

    expect(event.paymentFailed).toHaveBeenCalledWith({ reason: 'fail' })
    expect(options.stripe?.confirmPayment).not.toHaveBeenCalled()
    expect(options.redirectToConfirmation).not.toHaveBeenCalled()
    expect(options.redirectToOrderPlaced).not.toHaveBeenCalled()
    expect(options.setError).not.toHaveBeenCalledWith(expect.any(String))
  })

  it('does not navigate after order completion becomes stale', async () => {
    let resolveCompletion: (result: { success: true }) => void = () => undefined
    const completeOrder = vi.fn(
      () =>
        new Promise<{ success: true }>((resolve) => {
          resolveCompletion = resolve
        }),
    )
    let current = true
    const event = createEvent()
    const options = createOptions(event, () => current, {
      actions: {
        completeOrder,
        completePaymentSession: vi.fn().mockResolvedValue({
          ...paymentSession,
          status: 'completed',
        }),
      } as unknown as ExpressCheckoutPaymentActions,
    })
    preparePayment.mockResolvedValueOnce(preparation)

    const confirmation = runExpressCheckoutPayment(options)
    await vi.waitFor(() => expect(completeOrder).toHaveBeenCalledOnce())

    current = false
    resolveCompletion({ success: true })
    await confirmation

    expect(event.paymentFailed).toHaveBeenCalledWith({ reason: 'fail' })
    expect(options.redirectToConfirmation).not.toHaveBeenCalled()
    expect(options.redirectToOrderPlaced).not.toHaveBeenCalled()
  })

  it('does not retry confirmation navigation when the first navigation fails', async () => {
    const navigationError = new Error('confirmation navigation failed')
    const redirectToConfirmation = vi
      .fn()
      .mockRejectedValueOnce(navigationError)
    const event = createEvent()
    const options = createOptions(event, () => true, {
      actions: {
        completeOrder: vi.fn().mockResolvedValue({
          error: 'order completion failed',
          success: false,
        }),
        completePaymentSession: vi.fn().mockResolvedValue({
          ...paymentSession,
          status: 'completed',
        }),
      } as unknown as ExpressCheckoutPaymentActions,
      redirectToConfirmation,
    })
    preparePayment.mockResolvedValueOnce(preparation)

    await expect(runExpressCheckoutPayment(options)).rejects.toBe(
      navigationError,
    )

    expect(redirectToConfirmation).toHaveBeenCalledOnce()
  })
})
