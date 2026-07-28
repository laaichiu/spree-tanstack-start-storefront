import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode, RefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import { useCheckoutPaymentSubmit } from './use-checkout-payment-submit'

const completePaymentSessionMutation = vi.hoisted(() => vi.fn())
const createDirectPaymentMutation = vi.hoisted(() => vi.fn())
const completeOrderMutation = vi.hoisted(() => vi.fn())
const savedCardConfirmMutation = vi.hoisted(() => vi.fn())
const mutationState = vi.hoisted(() => ({
  completeOrderPending: false,
  completePaymentSessionPending: false,
  createDirectPaymentPending: false,
}))

vi.mock('./use-checkout-payment', () => ({
  useCompleteCheckoutOrder: () => ({
    isPending: mutationState.completeOrderPending,
    mutateAsync: completeOrderMutation,
  }),
  useCompleteCheckoutPaymentSession: () => ({
    isPending: mutationState.completePaymentSessionPending,
    mutateAsync: completePaymentSessionMutation,
  }),
  useCreateDirectCheckoutPayment: () => ({
    isPending: mutationState.createDirectPaymentPending,
    mutateAsync: createDirectPaymentMutation,
  }),
}))

vi.mock('./stripe-payment-confirmation', () => ({
  confirmStripeSavedCardPayment: savedCardConfirmMutation,
}))

afterEach(() => {
  cleanup()
  completePaymentSessionMutation.mockReset()
  createDirectPaymentMutation.mockReset()
  completeOrderMutation.mockReset()
  savedCardConfirmMutation.mockReset()
  mutationState.completeOrderPending = false
  mutationState.completePaymentSessionPending = false
  mutationState.createDirectPaymentPending = false
})

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {children}
    </MarketProvider>
  )
}

const selectedShippingRate: CartShippingRate = {
  deliveryMethodId: 'delivery-method-1',
  fulfillmentId: 'fulfillment-1',
  id: 'rate-1',
  name: 'Ground',
  displayPrice: {
    amount: 0,
    currencyCode: 'USD',
  },
  price: {
    amount: 0,
    currencyCode: 'USD',
  },
  selected: true,
}

const stripePaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

const directPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'unknown',
  id: 'pm-direct',
  name: 'Manual payment',
  sessionRequired: false,
  type: 'Spree::PaymentMethod::Check',
}

const adyenPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'adyen',
  id: 'pm-adyen',
  name: 'Adyen',
  sessionRequired: true,
  type: 'SpreeAdyen::Gateway',
}

function checkoutOrder(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    amountDue: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: ['cart', 'address', 'delivery'],
    currencyCode: 'USD',
    currentStep: 'payment',
    deliveryTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    discountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    email: 'customer@example.com',
    id: 'cart_123',
    itemCount: 1,
    itemTotal: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    items: [],
    paymentMethods: [stripePaymentMethod],
    requirements: [],
    shippingAddress: null,
    shippingMatchesBillingAddress: true,
    shippingRates: [selectedShippingRate],
    shippingDiscountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    taxTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    total: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    ...overrides,
  }
}

function paymentSession(
  overrides: Partial<CheckoutPaymentSession> = {},
): CheckoutPaymentSession {
  return {
    amount: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    currencyCode: 'USD',
    customerExternalId: null,
    expiresAt: null,
    externalData: {
      client_secret: 'pi_test_secret',
    },
    externalId: null,
    id: 'ps_123',
    orderId: 'cart_123',
    paymentMethodId: 'pm-stripe',
    status: 'processing',
    ...overrides,
  }
}

function stripePaymentHandle(
  overrides: Partial<StripePaymentElementHandle> = {},
): StripePaymentElementHandle {
  return {
    confirmPayment: vi.fn().mockResolvedValue({}),
    fetchUpdates: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function renderCheckoutPaymentSubmitHook(
  overrides: Partial<Parameters<typeof useCheckoutPaymentSubmit>[0]> = {},
) {
  const setPaymentError = vi.fn()
  const paymentHandle = stripePaymentHandle()
  const stripePaymentHandleRef = {
    current: paymentHandle,
  } as RefObject<StripePaymentElementHandle | null>
  const result = renderHook(
    () =>
      useCheckoutPaymentSubmit({
        cart: checkoutOrder(),
        clientSecret: 'pi_test_secret',
        isStripeElementReady: true,
        paymentSession: paymentSession(),
        selectedPaymentMethod: stripePaymentMethod,
        selectedSavedPaymentProfileIdForSession: null,
        selectedShippingRate,
        setPaymentError,
        shippingReady: true,
        stripePaymentHandleRef,
        ...overrides,
      }),
    {
      wrapper,
    },
  )

  return {
    paymentHandle,
    setPaymentError,
    stripePaymentHandleRef,
    ...result,
  }
}

async function submit(
  result: ReturnType<typeof renderCheckoutPaymentSubmitHook>['result'],
) {
  let submitResult:
    | Awaited<ReturnType<typeof result.current.submitPayment>>
    | undefined

  await act(async () => {
    submitResult = await result.current.submitPayment()
  })

  return submitResult
}

describe('useCheckoutPaymentSubmit', () => {
  it('completes zero-total orders without creating a payment', async () => {
    const completedOrder = checkoutOrder({
      amountDue: {
        amount: 0,
        currencyCode: 'USD',
      },
      currentStep: 'complete',
      total: {
        amount: 0,
        currencyCode: 'USD',
      },
    })
    completeOrderMutation.mockResolvedValueOnce({
      order: completedOrder,
      success: true,
    })

    const { result } = renderCheckoutPaymentSubmitHook({
      cart: checkoutOrder({
        amountDue: {
          amount: 0,
          currencyCode: 'USD',
        },
        total: {
          amount: 0,
          currencyCode: 'USD',
        },
      }),
      clientSecret: undefined,
      paymentSession: null,
      selectedPaymentMethod: null,
    })

    await expect(submit(result)).resolves.toEqual({
      order: completedOrder,
    })
    expect(createDirectPaymentMutation).not.toHaveBeenCalled()
    expect(completePaymentSessionMutation).not.toHaveBeenCalled()
    expect(completeOrderMutation).toHaveBeenCalledWith({
      selectedShippingRate,
    })
  })

  it('creates a direct payment before completing the order', async () => {
    const completedOrder = checkoutOrder({ currentStep: 'complete' })
    createDirectPaymentMutation.mockResolvedValueOnce({})
    completeOrderMutation.mockResolvedValueOnce({
      order: completedOrder,
      success: true,
    })

    const { result, setPaymentError } = renderCheckoutPaymentSubmitHook({
      clientSecret: undefined,
      paymentSession: null,
      selectedPaymentMethod: directPaymentMethod,
    })

    await expect(submit(result)).resolves.toEqual({
      order: completedOrder,
    })
    expect(setPaymentError).toHaveBeenCalledWith(null)
    expect(createDirectPaymentMutation).toHaveBeenCalledWith({
      paymentMethodId: 'pm-direct',
      selectedShippingRate,
    })
    expect(completeOrderMutation).toHaveBeenCalledWith({
      selectedShippingRate,
    })
  })

  it('confirms a Stripe Payment Element session before completing the order', async () => {
    const completedOrder = checkoutOrder({ currentStep: 'complete' })
    completePaymentSessionMutation.mockResolvedValueOnce(
      paymentSession({ status: 'completed' }),
    )
    completeOrderMutation.mockResolvedValueOnce({
      order: completedOrder,
      success: true,
    })

    const { paymentHandle, result } = renderCheckoutPaymentSubmitHook()

    await expect(submit(result)).resolves.toEqual({
      order: completedOrder,
    })
    expect(paymentHandle.confirmPayment).toHaveBeenCalledWith(
      `${window.location.origin}/us/en/confirm-payment/cart_123?session=ps_123`,
    )
    expect(completePaymentSessionMutation).toHaveBeenCalledWith({
      selectedShippingRate,
      sessionId: 'ps_123',
    })
    expect(completeOrderMutation).toHaveBeenCalledWith({
      selectedShippingRate,
    })
  })

  it('falls back to confirm-payment recovery when order completion fails after a Stripe session is confirmed', async () => {
    completePaymentSessionMutation.mockResolvedValueOnce(
      paymentSession({ status: 'completed' }),
    )
    completeOrderMutation.mockResolvedValueOnce({
      error: 'Gateway return is still settling',
      errorCode: 'order_complete_failed',
      success: false,
    })

    const { paymentHandle, result, setPaymentError } =
      renderCheckoutPaymentSubmitHook()

    await expect(submit(result)).resolves.toEqual({
      confirmPaymentSessionId: 'ps_123',
    })
    expect(paymentHandle.confirmPayment).toHaveBeenCalledWith(
      `${window.location.origin}/us/en/confirm-payment/cart_123?session=ps_123`,
    )
    expect(completePaymentSessionMutation).toHaveBeenCalledWith({
      selectedShippingRate,
      sessionId: 'ps_123',
    })
    expect(completeOrderMutation).toHaveBeenCalledWith({
      selectedShippingRate,
    })
    expect(setPaymentError).toHaveBeenCalledWith(null)
  })

  it('confirms a saved Stripe card without requiring a Payment Element handle', async () => {
    const completedOrder = checkoutOrder({ currentStep: 'complete' })
    savedCardConfirmMutation.mockResolvedValueOnce({})
    completePaymentSessionMutation.mockResolvedValueOnce(
      paymentSession({ status: 'completed' }),
    )
    completeOrderMutation.mockResolvedValueOnce({
      order: completedOrder,
      success: true,
    })

    const { result, stripePaymentHandleRef } = renderCheckoutPaymentSubmitHook({
      isStripeElementReady: false,
      selectedSavedPaymentProfileIdForSession: 'pm_saved',
    })
    stripePaymentHandleRef.current = null

    await expect(submit(result)).resolves.toEqual({
      order: completedOrder,
    })
    expect(savedCardConfirmMutation).toHaveBeenCalledWith({
      clientSecret: 'pi_test_secret',
      confirmPaymentFallbackMessage: 'Unable to confirm payment.',
      paymentMethodId: 'pm_saved',
      returnUrl: `${window.location.origin}/us/en/confirm-payment/cart_123?session=ps_123`,
      stripeNotLoadedMessage: 'Stripe has not loaded yet.',
    })
    expect(completePaymentSessionMutation).toHaveBeenCalledWith({
      selectedShippingRate,
      sessionId: 'ps_123',
    })
    expect(completeOrderMutation).toHaveBeenCalledWith({
      selectedShippingRate,
    })
  })

  it('stops when the completed payment session reports a failed status', async () => {
    completePaymentSessionMutation.mockResolvedValueOnce(
      paymentSession({ status: 'failed' }),
    )

    const { result } = renderCheckoutPaymentSubmitHook()

    await expect(submit(result)).resolves.toEqual({
      error: 'Payment was not successful. Please try again.',
    })
    expect(completeOrderMutation).not.toHaveBeenCalled()
  })

  it('returns payment form readiness errors before confirming Stripe', async () => {
    const { result, stripePaymentHandleRef } = renderCheckoutPaymentSubmitHook({
      isStripeElementReady: false,
    })
    stripePaymentHandleRef.current = null

    await expect(submit(result)).resolves.toEqual({
      error: 'Payment form is not ready yet.',
    })
    expect(completePaymentSessionMutation).not.toHaveBeenCalled()
  })

  it('lets Stripe validate incomplete Payment Element fields before completing the session', async () => {
    const { paymentHandle, result, setPaymentError } =
      renderCheckoutPaymentSubmitHook({
        isStripeElementReady: true,
      })
    vi.mocked(paymentHandle.confirmPayment).mockResolvedValueOnce({
      displayError: false,
      error: 'Your card number is incomplete.',
    })

    await expect(submit(result)).resolves.toEqual({
      displayError: false,
      error: 'Your card number is incomplete.',
    })
    expect(paymentHandle.confirmPayment).toHaveBeenCalledWith(
      `${window.location.origin}/us/en/confirm-payment/cart_123?session=ps_123`,
    )
    expect(setPaymentError).toHaveBeenCalledWith(null)
    expect(setPaymentError).not.toHaveBeenCalledWith(
      'Your card number is incomplete.',
    )
    expect(completePaymentSessionMutation).not.toHaveBeenCalled()
    expect(completeOrderMutation).not.toHaveBeenCalled()
  })

  it('surfaces Stripe confirmation errors and skips payment session completion', async () => {
    const { paymentHandle, result, setPaymentError } =
      renderCheckoutPaymentSubmitHook()
    vi.mocked(paymentHandle.confirmPayment).mockResolvedValueOnce({
      error: 'Card declined',
    })

    await expect(submit(result)).resolves.toEqual({
      error: 'Card declined',
    })
    expect(setPaymentError).toHaveBeenCalledWith('Card declined')
    expect(completePaymentSessionMutation).not.toHaveBeenCalled()
    expect(completeOrderMutation).not.toHaveBeenCalled()
  })

  it('rejects unsupported session gateways before creating payment', async () => {
    const { result } = renderCheckoutPaymentSubmitHook({
      selectedPaymentMethod: adyenPaymentMethod,
    })

    await expect(submit(result)).resolves.toEqual({
      error:
        'This session payment method is not supported in the storefront yet.',
    })
    expect(completePaymentSessionMutation).not.toHaveBeenCalled()
    expect(completeOrderMutation).not.toHaveBeenCalled()
  })

  it('maps completion error codes to customer-facing messages', async () => {
    completeOrderMutation.mockResolvedValueOnce({
      error: 'Backend said no',
      errorCode: 'order_complete_failed',
      success: false,
    })

    const { result } = renderCheckoutPaymentSubmitHook({
      cart: checkoutOrder({
        amountDue: {
          amount: 0,
          currencyCode: 'USD',
        },
      }),
      selectedPaymentMethod: null,
    })

    await expect(submit(result)).resolves.toEqual({
      error: 'Order could not be completed. Please try again.',
    })
  })

  it('sets mutation errors as the visible payment error', async () => {
    createDirectPaymentMutation.mockRejectedValueOnce(new Error('Gateway down'))

    const { result, setPaymentError } = renderCheckoutPaymentSubmitHook({
      clientSecret: undefined,
      paymentSession: null,
      selectedPaymentMethod: directPaymentMethod,
    })

    await expect(submit(result)).resolves.toEqual({
      error: 'Gateway down',
    })
    expect(setPaymentError).toHaveBeenCalledWith('Gateway down')
  })
})
