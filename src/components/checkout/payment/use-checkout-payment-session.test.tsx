import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type {
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { useCheckoutPaymentSession } from './use-checkout-payment-session'

const paymentSessionMutation = vi.hoisted(() => vi.fn())
const paymentSessionState = vi.hoisted(() => ({
  isPending: false,
}))

vi.mock('@/lib/stripe/client', () => ({
  isStripeConfigured: true,
}))

vi.mock('./use-checkout-payment', () => ({
  useCreateCheckoutPaymentSession: () => ({
    isPending: paymentSessionState.isPending,
    mutateAsync: paymentSessionMutation,
  }),
}))

afterEach(() => {
  cleanup()
  paymentSessionMutation.mockReset()
  paymentSessionState.isPending = false
})

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {children}
    </MarketProvider>
  )
}

const stripePaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

const paypalPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'paypal',
  id: 'pm-paypal',
  name: 'PayPal',
  sessionRequired: true,
  type: 'SpreePaypalCheckout::Gateway',
}

const directPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'unknown',
  id: 'pm-direct',
  name: 'Check',
  sessionRequired: false,
  type: 'Spree::PaymentMethod::Check',
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

function paymentSession(
  externalData: CheckoutPaymentSession['externalData'] = {
    client_secret: 'pi_test_secret',
  },
): CheckoutPaymentSession {
  return {
    amount: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    currencyCode: 'USD',
    customerExternalId: null,
    expiresAt: null,
    externalData,
    externalId: null,
    id: 'ps_123',
    orderId: 'cart_123',
    paymentMethodId: 'pm-stripe',
    status: 'processing',
  }
}

function renderCheckoutPaymentSessionHook(
  overrides: Partial<Parameters<typeof useCheckoutPaymentSession>[0]> = {},
) {
  const onResetStripeElement = vi.fn()
  const result = renderHook(
    () =>
      useCheckoutPaymentSession({
        cartId: 'cart_123',
        onResetStripeElement,
        selectedPaymentMethod: stripePaymentMethod,
        selectedSavedStripePaymentMethodId: null,
        selectedSessionKey: 'cart_123:pm-stripe:stripe:session',
        selectedShippingRate,
        ...overrides,
      }),
    {
      wrapper,
    },
  )

  return {
    onResetStripeElement,
    ...result,
  }
}

describe('useCheckoutPaymentSession', () => {
  it('creates a Stripe payment session with checkout return URL', async () => {
    paymentSessionMutation.mockResolvedValueOnce(paymentSession())

    const { result } = renderCheckoutPaymentSessionHook()

    await waitFor(() => {
      expect(result.current.clientSecret).toBe('pi_test_secret')
    })

    expect(paymentSessionMutation).toHaveBeenCalledWith({
      externalData: {},
      paymentMethodId: 'pm-stripe',
      selectedShippingRate,
    })
    expect(result.current.paymentSession?.id).toBe('ps_123')
    expect(result.current.paymentError).toBeNull()
  })

  it('adds saved Stripe payment method id to session external data', async () => {
    paymentSessionMutation.mockResolvedValueOnce(paymentSession())

    const { result } = renderCheckoutPaymentSessionHook({
      selectedSavedStripePaymentMethodId: 'pm_saved',
      selectedSessionKey: 'cart_123:pm-stripe:stripe:session:pm_saved',
    })

    await waitFor(() => {
      expect(result.current.clientSecret).toBe('pi_test_secret')
    })

    expect(paymentSessionMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        externalData: {
          stripe_payment_method_id: 'pm_saved',
        },
      }),
    )
  })

  it('creates a Stripe payment session before shipping is selected', async () => {
    paymentSessionMutation.mockResolvedValueOnce(paymentSession())

    const { result } = renderCheckoutPaymentSessionHook({
      selectedShippingRate: null,
    })

    await waitFor(() => {
      expect(result.current.clientSecret).toBe('pi_test_secret')
    })

    expect(paymentSessionMutation).toHaveBeenCalledWith({
      externalData: {},
      paymentMethodId: 'pm-stripe',
      selectedShippingRate: null,
    })
    expect(result.current.paymentSession?.id).toBe('ps_123')
    expect(result.current.paymentError).toBeNull()
  })

  it('restarts initialization when an equivalent checkout dependency changes before the first request settles', async () => {
    let resolveFirstSession!: (session: CheckoutPaymentSession) => void
    let selectedRate: CartShippingRate | null = selectedShippingRate
    const firstSessionPromise = new Promise<CheckoutPaymentSession>(
      (resolve) => {
        resolveFirstSession = resolve
      },
    )

    paymentSessionMutation
      .mockReturnValueOnce(firstSessionPromise)
      .mockResolvedValueOnce(paymentSession())

    const onResetStripeElement = vi.fn()
    const { rerender, result } = renderHook(
      () =>
        useCheckoutPaymentSession({
          cartId: 'cart_123',
          onResetStripeElement,
          selectedPaymentMethod: stripePaymentMethod,
          selectedSavedStripePaymentMethodId: null,
          selectedSessionKey: 'cart_123:pm-stripe:stripe:session',
          selectedShippingRate: selectedRate,
        }),
      {
        wrapper,
      },
    )

    expect(paymentSessionMutation).toHaveBeenCalledTimes(1)

    selectedRate = { ...selectedShippingRate }
    rerender()

    await waitFor(() => {
      expect(result.current.clientSecret).toBe('pi_test_secret')
    })

    expect(paymentSessionMutation).toHaveBeenCalledTimes(2)
    expect(result.current.paymentSession?.id).toBe('ps_123')
    expect(result.current.paymentError).toBeNull()

    await act(async () => {
      resolveFirstSession(paymentSession({ client_secret: 'pi_stale_secret' }))
      await firstSessionPromise
    })

    expect(result.current.clientSecret).toBe('pi_test_secret')
  })

  it('does not create a session for direct payment methods', async () => {
    const { result } = renderCheckoutPaymentSessionHook({
      selectedPaymentMethod: directPaymentMethod,
      selectedSessionKey: 'cart_123:pm-direct:unknown:direct',
    })

    await waitFor(() => {
      expect(result.current.paymentSession).toBeNull()
    })

    expect(paymentSessionMutation).not.toHaveBeenCalled()
    expect(result.current.paymentError).toBeNull()
  })

  it('reports unsupported session gateways without creating a session', async () => {
    const { result } = renderCheckoutPaymentSessionHook({
      selectedPaymentMethod: paypalPaymentMethod,
      selectedSessionKey: 'cart_123:pm-paypal:paypal:session',
    })

    await waitFor(() => {
      expect(result.current.paymentError).toBe(
        'This session payment method is not supported in the storefront yet.',
      )
    })

    expect(paymentSessionMutation).not.toHaveBeenCalled()
    expect(result.current.isPaymentSessionRetryable).toBe(false)
  })

  it('reports missing Stripe client secret from provider session data', async () => {
    paymentSessionMutation.mockResolvedValueOnce(paymentSession({}))

    const { result } = renderCheckoutPaymentSessionHook()

    await waitFor(() => {
      expect(result.current.paymentError).toBe(
        'Stripe session is missing client secret. Refresh checkout and try again.',
      )
    })

    expect(result.current.paymentSession).toBeNull()
    expect(result.current.isPaymentSessionRetryable).toBe(true)
  })

  it('reports payment session creation errors', async () => {
    paymentSessionMutation.mockRejectedValueOnce(new Error('Gateway offline'))

    const { result } = renderCheckoutPaymentSessionHook()

    await waitFor(() => {
      expect(result.current.paymentError).toBe('Gateway offline')
    })

    expect(result.current.paymentSession).toBeNull()
    expect(result.current.isPaymentSessionRetryable).toBe(true)
  })

  it('retries payment session creation for the same checkout state after setup fails', async () => {
    paymentSessionMutation
      .mockRejectedValueOnce(new Error('Gateway offline'))
      .mockResolvedValueOnce(paymentSession())

    const { result } = renderCheckoutPaymentSessionHook()

    await waitFor(() => {
      expect(result.current.paymentError).toBe('Gateway offline')
    })
    expect(paymentSessionMutation).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.retryPaymentSession()
    })

    await waitFor(() => {
      expect(result.current.clientSecret).toBe('pi_test_secret')
    })

    expect(result.current.paymentError).toBeNull()
    expect(result.current.isPaymentSessionRetryable).toBe(false)
    expect(paymentSessionMutation).toHaveBeenCalledTimes(2)
  })

  it('ignores an in-flight session after the checkout resets payment setup', async () => {
    let resolveSession!: (session: CheckoutPaymentSession) => void
    const pendingSession = new Promise<CheckoutPaymentSession>((resolve) => {
      resolveSession = resolve
    })
    paymentSessionMutation.mockReturnValueOnce(pendingSession)

    const { result } = renderCheckoutPaymentSessionHook()

    expect(paymentSessionMutation).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.resetPaymentSession()
    })

    await act(async () => {
      resolveSession(paymentSession())
      await pendingSession
    })

    expect(result.current.paymentSession).toBeNull()
    expect(result.current.clientSecret).toBeUndefined()
  })
})
