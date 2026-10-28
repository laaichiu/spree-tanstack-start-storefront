import { act, cleanup, renderHook } from '@testing-library/react'
import type {
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { useExpressCheckoutFlow } from './use-express-checkout-flow'

const server = vi.hoisted(() => ({
  buildCurrentLineItems: vi.fn(() => []),
  buildLineItems: vi.fn(() => []),
  handleShippingAddressChange: vi.fn(),
  handleShippingRateChange: vi.fn(),
  updateElementsAmount: vi.fn(),
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: {
      country: 'us',
      locale: 'en',
    },
    t: (key: string) => key,
  }),
}))

vi.mock('./use-express-checkout', () => ({
  useExpressCheckoutActions: () => ({}),
}))

vi.mock('./use-express-checkout-line-items', () => ({
  useExpressCheckoutLineItems: () => ({
    buildCurrentLineItems: server.buildCurrentLineItems,
    buildLineItems: server.buildLineItems,
    updateElementsAmount: server.updateElementsAmount,
  }),
}))

vi.mock('./use-express-checkout-payment', () => ({
  useExpressCheckoutPayment: () => vi.fn(),
}))

vi.mock('./use-express-checkout-shipping', () => ({
  useExpressCheckoutShipping: () => ({
    handleShippingAddressChange: server.handleShippingAddressChange,
    handleShippingRateChange: server.handleShippingRateChange,
  }),
}))

const firstCart = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const secondCart = { ...firstCart, id: 'cart_second' }

function createReadyEvent() {
  return {
    availablePaymentMethods: {
      applePay: true,
      googlePay: false,
      link: false,
    },
  } as unknown as StripeExpressCheckoutElementReadyEvent
}

function createClickEvent() {
  return {
    expressPaymentType: 'apple_pay',
    reject: vi.fn(),
    resolve: vi.fn(),
  } as unknown as StripeExpressCheckoutElementClickEvent
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useExpressCheckoutFlow owner lifecycle', () => {
  it('ignores late ready and click events from the previous cart owner', () => {
    const { result, rerender } = renderHook(
      ({ cart }: { cart: typeof firstCart }) =>
        useExpressCheckoutFlow({ cart }),
      { initialProps: { cart: firstCart } },
    )

    act(() => {
      result.current.handleReady(createReadyEvent())
    })

    expect(result.current.available).toBe(true)

    const oldReadyHandler = result.current.handleReady
    const oldClickHandler = result.current.handleClick
    rerender({ cart: secondCart })

    const staleClickEvent = createClickEvent()
    act(() => {
      oldReadyHandler(createReadyEvent())
      oldClickHandler(staleClickEvent)
    })

    expect(result.current.available).toBeNull()
    expect(staleClickEvent.reject).toHaveBeenCalledOnce()
    expect(staleClickEvent.resolve).not.toHaveBeenCalled()
    expect(server.buildCurrentLineItems).not.toHaveBeenCalled()
  })

  it('ignores late events after the owner returns with the same key', () => {
    const { result, rerender } = renderHook(
      ({ cart }: { cart: typeof firstCart }) =>
        useExpressCheckoutFlow({ cart }),
      { initialProps: { cart: firstCart } },
    )

    const oldReadyHandler = result.current.handleReady
    const oldClickHandler = result.current.handleClick

    rerender({ cart: secondCart })
    rerender({ cart: firstCart })

    const staleClickEvent = createClickEvent()
    act(() => {
      oldReadyHandler(createReadyEvent())
      oldClickHandler(staleClickEvent)
    })

    expect(result.current.available).toBeNull()
    expect(staleClickEvent.reject).toHaveBeenCalledOnce()
    expect(staleClickEvent.resolve).not.toHaveBeenCalled()
    expect(server.buildCurrentLineItems).not.toHaveBeenCalled()
  })
})
