import type {
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import type { ExpressCheckoutShippingActions } from '@/lib/checkout/utils/express/express-checkout-actions'

import { useExpressCheckoutShipping } from './use-express-checkout-shipping'

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({ t: (key: string) => key }),
}))

const checkoutOrder = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })

function createAddressChangeEvent() {
  return {
    address: {
      city: 'San Francisco',
      country: 'US',
      postal_code: '94105',
      state: 'CA',
    },
    reject: vi.fn(),
    resolve: vi.fn(),
  } as unknown as StripeExpressCheckoutElementShippingAddressChangeEvent
}

function createRateChangeEvent() {
  return {
    reject: vi.fn(),
    resolve: vi.fn(),
    shippingRate: {
      amount: 500,
      id: 'stripe-rate-1',
    },
  } as unknown as StripeExpressCheckoutElementShippingRateChangeEvent
}

describe('useExpressCheckoutShipping', () => {
  it('clears an old rate map while a newer address response is pending', async () => {
    let resolveAddress: (result: {
      order: typeof checkoutOrder
      success: true
    }) => void = () => undefined
    const addressRequest = new Promise<{
      order: typeof checkoutOrder
      success: true
    }>((resolve) => {
      resolveAddress = resolve
    })
    const actions: ExpressCheckoutShippingActions = {
      resolveShipping: vi.fn(() => addressRequest),
      selectShippingRates: vi.fn(),
    }
    const { result } = renderHook(() =>
      useExpressCheckoutShipping({
        actions,
        buildLineItems: () => [],
        isGooglePayRef: { current: false },
        ownerKey: 'cart_123:us:en',
        setError: vi.fn(),
        updateElementsAmount: vi.fn(),
      }),
    )

    const addressEvent = createAddressChangeEvent()
    const rateEvent = createRateChangeEvent()
    let addressFlow: Promise<unknown> | undefined
    let rateFlow: Promise<unknown> | undefined

    act(() => {
      addressFlow = result.current.handleShippingAddressChange(addressEvent)
      rateFlow = result.current.handleShippingRateChange(rateEvent)
    })

    await act(async () => {
      await rateFlow
      resolveAddress({ order: checkoutOrder, success: true })
      await addressFlow
    })

    expect(actions.selectShippingRates).not.toHaveBeenCalled()
    expect(rateEvent.reject).toHaveBeenCalledOnce()
    expect(addressEvent.reject).toHaveBeenCalledOnce()
    expect(addressEvent.resolve).not.toHaveBeenCalled()
  })

  it('rejects an old address response after the checkout owner changes', async () => {
    let resolveAddress: (result: {
      order: typeof checkoutOrder
      success: true
    }) => void = () => undefined
    const addressRequest = new Promise<{
      order: typeof checkoutOrder
      success: true
    }>((resolve) => {
      resolveAddress = resolve
    })
    const setError = vi.fn()
    const updateElementsAmount = vi.fn()
    const actions: ExpressCheckoutShippingActions = {
      resolveShipping: vi.fn(() => addressRequest),
      selectShippingRates: vi.fn(),
    }
    const { result, rerender } = renderHook(
      ({ ownerKey }: { ownerKey: string }) =>
        useExpressCheckoutShipping({
          actions,
          buildLineItems: () => [],
          isGooglePayRef: { current: false },
          ownerKey,
          setError,
          updateElementsAmount,
        }),
      { initialProps: { ownerKey: 'cart_123:us:en' } },
    )

    const addressEvent = createAddressChangeEvent()
    let addressFlow: Promise<unknown> | undefined
    act(() => {
      addressFlow = result.current.handleShippingAddressChange(addressEvent)
    })

    rerender({ ownerKey: 'cart_123:ca:en-CA' })

    await act(async () => {
      resolveAddress({ order: checkoutOrder, success: true })
      await addressFlow
    })

    expect(addressEvent.reject).toHaveBeenCalledOnce()
    expect(addressEvent.resolve).not.toHaveBeenCalled()
    expect(setError).not.toHaveBeenCalled()
    expect(updateElementsAmount).not.toHaveBeenCalled()
  })
})
