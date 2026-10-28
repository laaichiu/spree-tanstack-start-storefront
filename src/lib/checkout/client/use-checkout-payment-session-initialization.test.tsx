// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import type { MutableRefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import type { CheckoutPaymentSession } from '../utils/payment/payment-session-contract'
import { useCheckoutPaymentSessionInitialization } from './use-checkout-payment-session-initialization'
import { useCheckoutPaymentSessionState } from './use-checkout-payment-session-state'

const initializePaymentSession = vi.hoisted(() => vi.fn())

vi.mock('../utils/payment/payment-session-initialization', () => ({
  initializeCheckoutPaymentSession: initializePaymentSession,
}))

vi.mock('../../stripe/client', () => ({
  isStripeConfigured: true,
}))

const market: MarketSelectionInput = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}
const paymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}
const shippingRate: CartShippingRate = {
  deliveryMethodId: 'dm-standard',
  displayPrice: { amount: 5, currencyCode: 'USD' },
  fulfillmentId: 'fulfillment-1',
  id: 'rate-1',
  name: 'Standard',
  price: { amount: 5, currencyCode: 'USD' },
  selected: true,
}
const paymentSession: CheckoutPaymentSession = {
  id: 'ps_123',
  providerData: { clientSecret: 'secret' },
  status: 'pending',
}

function createOptions(
  selectedShippingRate: CartShippingRate,
  overrides: Partial<{
    lastPaymentSessionKeyRef: MutableRefObject<string | null>
    paymentSessionGenerationRef: MutableRefObject<number>
  }> = {},
) {
  return {
    cartId: 'cart_123',
    createPaymentSessionAsync: vi.fn(),
    lastPaymentSessionKeyRef: overrides.lastPaymentSessionKeyRef ?? {
      current: null,
    },
    market,
    onResetStripeElement: vi.fn(),
    paymentSessionGenerationRef: overrides.paymentSessionGenerationRef ?? {
      current: 0,
    },
    paymentSessionRetryKey: 0,
    resetPaymentSession: vi.fn(),
    selectedPaymentMethod: paymentMethod,
    selectedSavedStripePaymentMethodId: null,
    selectedSessionKey: 'us:en:cart_123:pm-stripe:stripe:session:USD',
    selectedShippingRate,
    setIsPaymentSessionRetryable: vi.fn(),
    setPaymentError: vi.fn(),
    setPaymentSession: vi.fn(),
    t: () => 'message',
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout payment-session initialization', () => {
  it('keeps one initialization when equivalent input objects rerender', async () => {
    let resolveInitialization: (
      result: CheckoutPaymentSessionInitializationResult,
    ) => void = () => undefined
    const initialization =
      new Promise<CheckoutPaymentSessionInitializationResult>((resolve) => {
        resolveInitialization = resolve
      })
    initializePaymentSession.mockReturnValue(initialization)

    const initialOptions = createOptions(shippingRate)
    const { rerender } = renderHook(
      (options) => useCheckoutPaymentSessionInitialization(options),
      { initialProps: initialOptions },
    )

    expect(initializePaymentSession).toHaveBeenCalledOnce()

    rerender({ ...initialOptions, selectedShippingRate: { ...shippingRate } })

    expect(initializePaymentSession).toHaveBeenCalledOnce()

    await act(async () => {
      resolveInitialization({ session: paymentSession, type: 'success' })
      await initialization
    })

    expect(initialOptions.setPaymentSession).toHaveBeenCalledWith(
      paymentSession,
    )
  })

  it('ignores a previous key response after the selected session changes', async () => {
    let resolveFirstInitialization: (
      result: CheckoutPaymentSessionInitializationResult,
    ) => void = () => undefined
    let resolveSecondInitialization: (
      result: CheckoutPaymentSessionInitializationResult,
    ) => void = () => undefined
    const firstInitialization =
      new Promise<CheckoutPaymentSessionInitializationResult>((resolve) => {
        resolveFirstInitialization = resolve
      })
    const secondInitialization =
      new Promise<CheckoutPaymentSessionInitializationResult>((resolve) => {
        resolveSecondInitialization = resolve
      })
    initializePaymentSession
      .mockReturnValueOnce(firstInitialization)
      .mockReturnValueOnce(secondInitialization)

    const initialOptions = createOptions(shippingRate)
    const { rerender } = renderHook(
      (options) => useCheckoutPaymentSessionInitialization(options),
      { initialProps: initialOptions },
    )

    rerender({
      ...initialOptions,
      selectedSessionKey: 'us:en:cart_123:pm-stripe:stripe:session:USD:rate-2',
      selectedShippingRate: { ...shippingRate, id: 'rate-2' },
    })

    expect(initializePaymentSession).toHaveBeenCalledTimes(2)
    initialOptions.setPaymentSession.mockClear()

    await act(async () => {
      resolveFirstInitialization({
        session: { ...paymentSession, id: 'ps_old' },
        type: 'success',
      })
      await firstInitialization
    })

    expect(initialOptions.setPaymentSession).not.toHaveBeenCalled()

    await act(async () => {
      resolveSecondInitialization({ session: paymentSession, type: 'success' })
      await secondInitialization
    })

    expect(initialOptions.setPaymentSession).toHaveBeenCalledWith(
      paymentSession,
    )
  })
})

type CheckoutPaymentSessionInitializationResult =
  | { session: CheckoutPaymentSession; type: 'success' }
  | { message: string; type: 'error' | 'missing_client_secret' }

describe('payment initialization with real session state', () => {
  it.each([
    { name: 'no payment method for a fully covered cart', method: null },
    {
      name: 'a direct payment method',
      method: { ...paymentMethod, sessionRequired: false },
    },
    {
      name: 'an unsupported session gateway',
      method: { ...paymentMethod, gatewayId: 'paypal' as const },
    },
  ])(
    'settles reset state for $name across rerenders and owner changes',
    ({ method }) => {
      const options = createOptions(shippingRate)
      const onResetStripeElement = vi.fn()
      let renders = 0
      const { result, rerender } = renderHook(
        ({ cartId }) => {
          if (++renders > 12) throw new Error('Payment reset did not settle')
          const state = useCheckoutPaymentSessionState({
            onResetStripeElement,
            ownerKey: `${cartId}:us:en:empty`,
          })
          useCheckoutPaymentSessionInitialization({
            ...options,
            ...state,
            cartId,
            onResetStripeElement,
            selectedPaymentMethod: method,
            selectedSessionKey: '',
          })
          return state
        },
        { initialProps: { cartId: 'cart_first' } },
      )

      expect(onResetStripeElement).toHaveBeenCalledTimes(1)
      expect(result.current.paymentSession).toBeNull()
      expect(result.current.paymentError).toBe(
        method?.gatewayId === 'paypal' ? 'message' : null,
      )
      rerender({ cartId: 'cart_first' })
      expect(onResetStripeElement).toHaveBeenCalledTimes(1)
      rerender({ cartId: 'cart_next' })
      expect(onResetStripeElement).toHaveBeenCalledTimes(2)
      expect(initializePaymentSession).not.toHaveBeenCalled()
      expect(renders).toBeLessThan(8)
    },
  )
})
