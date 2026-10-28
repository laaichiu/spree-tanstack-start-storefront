// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { CartResourceIdentityMismatchError } from '@/lib/cart/utils/cart-identity'

import {
  toCheckoutCodeSuccessResult,
  toRemoveCheckoutCodeSuccessResult,
} from './checkout-code-result.server'
import type { CheckoutCodeCartResource } from './checkout-code-result.server'

const server = vi.hoisted(() => ({
  CheckoutCartSessionMismatchError: class extends Error {
    constructor() {
      super('This checkout session no longer matches the active cart.')
      this.name = 'CheckoutCartSessionMismatchError'
    }
  },
  mapCheckout: vi.fn(),
  persistCartCookies: vi.fn(),
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: server.mapCheckout,
}))

vi.mock('../checkout-session.server', () => ({
  CheckoutCartSessionMismatchError: server.CheckoutCartSessionMismatchError,
  persistCheckoutCartCookies: server.persistCartCookies,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

const cart = {
  currency: 'USD',
  id: 'cart_123',
  market_id: 'market-us',
  token: 'cart-token',
} as unknown as CheckoutCodeCartResource

const mappedOrder = { id: 'cart_123' } as unknown as CheckoutOrder

afterEach(() => {
  vi.clearAllMocks()
})

describe('checkout code result projection', () => {
  it('maps a discount result before persisting cart access', () => {
    server.mapCheckout.mockReturnValue(mappedOrder)

    expect(
      toCheckoutCodeSuccessResult({
        cart,
        cartId: 'cart_123',
        cartToken: 'cart-token',
        expectedCurrentCartToken: 'cart-token',
        market,
        type: 'discount',
      }),
    ).toEqual({ order: mappedOrder, success: true, type: 'discount' })

    expect(server.mapCheckout).toHaveBeenCalledWith(cart, { locale: 'en' })
    expect(server.persistCartCookies).toHaveBeenCalledOnce()
  })

  it('does not persist a discount response when mapping fails', () => {
    const projectionError = new Error('checkout mapping failed')
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })

    expect(() =>
      toCheckoutCodeSuccessResult({
        cart,
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        type: 'discount',
      }),
    ).toThrow(projectionError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('stops before returning a discount success when persistence loses ownership', () => {
    server.mapCheckout.mockReturnValue(mappedOrder)
    server.persistCartCookies.mockReturnValue(false)

    expect(() =>
      toCheckoutCodeSuccessResult({
        cart,
        cartId: 'cart_123',
        cartToken: 'cart-token',
        expectedCurrentCartToken: 'cart-token',
        market,
        type: 'discount',
      }),
    ).toThrow('This checkout session no longer matches the active cart.')
  })

  it('does not persist a gift-card removal response when mapping fails', () => {
    server.mapCheckout.mockImplementationOnce(() => {
      throw new Error('checkout mapping failed')
    })

    expect(() =>
      toRemoveCheckoutCodeSuccessResult({
        cart,
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
      }),
    ).toThrow('checkout mapping failed')

    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('stops before returning a removal success when persistence loses ownership', () => {
    server.mapCheckout.mockReturnValue(mappedOrder)
    server.persistCartCookies.mockReturnValue(false)

    expect(() =>
      toRemoveCheckoutCodeSuccessResult({
        cart,
        cartId: 'cart_123',
        cartToken: 'cart-token',
        expectedCurrentCartToken: 'cart-token',
        market,
      }),
    ).toThrow('This checkout session no longer matches the active cart.')
  })

  it('rejects a response for another cart before mapping or persistence', () => {
    expect(() =>
      toCheckoutCodeSuccessResult({
        cart: { ...cart, id: 'cart_other' },
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        type: 'gift_card',
      }),
    ).toThrow(CartResourceIdentityMismatchError)

    expect(server.mapCheckout).not.toHaveBeenCalled()
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })
})
