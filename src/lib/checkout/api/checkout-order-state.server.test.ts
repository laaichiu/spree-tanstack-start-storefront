import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import {
  CartResourceIdentityMismatchError,
  CartResourceTypeMismatchError,
} from '@/lib/cart/utils/cart-identity'
import { CheckoutOrderResourceIdentityMismatchError } from '@/lib/checkout/utils/order-resource-identity'

import {
  ensureCheckoutShippingRateForPayment,
  ensureCheckoutShippingRateForPaymentWithToken,
  readCheckoutOrderState,
  readCheckoutOrderStateWithToken,
  requireActiveCheckoutOrder,
} from './checkout-order-state.server'

const server = vi.hoisted(() => {
  class MockCartResourceIdentityMismatchError extends Error {
    constructor() {
      super('The cart response does not match the requested cart.')
      this.name = 'CartResourceIdentityMismatchError'
    }
  }

  class MockCartResourceTypeMismatchError extends Error {
    constructor() {
      super('The response is not a cart resource.')
      this.name = 'CartResourceTypeMismatchError'
    }
  }

  class MockCheckoutCartSessionMismatchError extends Error {
    constructor() {
      super('This checkout session no longer matches the active cart.')
      this.name = 'CheckoutCartSessionMismatchError'
    }
  }

  return {
    CartResourceIdentityMismatchError: MockCartResourceIdentityMismatchError,
    CartResourceTypeMismatchError: MockCartResourceTypeMismatchError,
    CheckoutCartSessionMismatchError: MockCheckoutCartSessionMismatchError,
    assertCartIsCart: vi.fn(),
    assertCartMatchesId: vi.fn(
      (resource: { id?: unknown }, expectedCartId: string) => {
        if (resource.id !== expectedCartId) {
          throw new MockCartResourceIdentityMismatchError()
        }
      },
    ),
    assertCartMarket: vi.fn(),
    clearCheckoutCartCookiesIfOwnedByCart: vi.fn(),
    fulfillmentsUpdate: vi.fn(),
    getCart: vi.fn(),
    getOrder: vi.fn(),
    isCartResourceIdentityMismatchError: (error: unknown) =>
      error instanceof MockCartResourceIdentityMismatchError,
    isCartResourceTypeMismatchError: (error: unknown) =>
      error instanceof MockCartResourceTypeMismatchError,
    isRecoverableCartResponseError: vi.fn(() => false),
    mapCheckout: vi.fn(),
    persistCartCookies: vi.fn(),
    updateCart: vi.fn(),
  }
})

vi.mock('@/lib/cart/utils/cart-errors', () => ({
  isRecoverableCartResponseError: server.isRecoverableCartResponseError,
}))

vi.mock('@/lib/cart/utils/cart-market', () => ({
  assertSpreeCartResourceMatchesMarket: server.assertCartMarket,
  isCartMarketMismatchError: vi.fn(() => false),
}))

vi.mock('@/lib/cart/utils/cart-identity', () => ({
  CartResourceIdentityMismatchError: server.CartResourceIdentityMismatchError,
  CartResourceTypeMismatchError: server.CartResourceTypeMismatchError,
  assertCartResourceIsCart: server.assertCartIsCart,
  assertCartResourceMatchesId: server.assertCartMatchesId,
  isCartResourceIdentityMismatchError:
    server.isCartResourceIdentityMismatchError,
  isCartResourceTypeMismatchError: server.isCartResourceTypeMismatchError,
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: server.mapCheckout,
}))

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: vi.fn(),
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: () => ({
    carts: {
      fulfillments: {
        update: server.fulfillmentsUpdate,
      },
      get: server.getCart,
      update: server.updateCart,
    },
    orders: {
      get: server.getOrder,
    },
  }),
}))

vi.mock('./checkout-session.server', () => ({
  clearCheckoutCartCookiesIfOwnedByCart:
    server.clearCheckoutCartCookiesIfOwnedByCart,
  CheckoutCartSessionMismatchError: server.CheckoutCartSessionMismatchError,
  getCheckoutCartRequestOptions: vi.fn(
    (cartToken?: string, customerToken?: string) => ({
      ...(cartToken ? { spreeToken: cartToken } : {}),
      ...(customerToken ? { token: customerToken } : {}),
    }),
  ),
  persistCheckoutCartCookies: server.persistCartCookies,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}
const checkoutOrder = {
  amountDue: null,
  id: 'cart_123',
  paymentMethods: [],
  shippingRates: [
    {
      fulfillmentId: 'fulfillment_123',
      id: 'rate_123',
    },
  ],
} as unknown as CheckoutOrder

afterEach(() => {
  vi.clearAllMocks()
  server.assertCartIsCart.mockReset()
  server.clearCheckoutCartCookiesIfOwnedByCart.mockReset()
  server.assertCartMarket.mockReset()
  server.fulfillmentsUpdate.mockReset()
  server.getCart.mockReset()
  server.getOrder.mockReset()
  server.isRecoverableCartResponseError.mockReset().mockReturnValue(false)
  server.mapCheckout.mockReset()
  server.persistCartCookies.mockReset()
  server.updateCart.mockReset()
})

describe('checkout order state', () => {
  it('rejects a missing active checkout after a mutation', () => {
    expect(() => requireActiveCheckoutOrder(null)).toThrow(
      'Checkout is no longer available.',
    )
    expect(requireActiveCheckoutOrder(checkoutOrder)).toBe(checkoutOrder)
  })

  it('preserves the cart handle when order lookup returns an order resource', async () => {
    const cartReadError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const order = { id: 'or_123' }
    const returnedCheckoutOrder = { id: 'cart_123' } as unknown as CheckoutOrder
    server.getCart.mockRejectedValue(cartReadError)
    server.isRecoverableCartResponseError.mockReturnValue(true)
    server.updateCart.mockRejectedValue(new Error('cart update unavailable'))
    server.getOrder.mockResolvedValue(order)
    server.mapCheckout.mockReturnValue(returnedCheckoutOrder)

    await expect(
      readCheckoutOrderState({
        cartId: returnedCheckoutOrder.id,
        cartToken: 'cart-token',
        market,
      }),
    ).resolves.toBe(returnedCheckoutOrder)

    expect(server.persistCartCookies).toHaveBeenCalledWith(order, market, {
      cartIdOverride: returnedCheckoutOrder.id,
      expectedCurrentCartToken: 'cart-token',
      fallbackToken: 'cart-token',
    })
    expect(server.mapCheckout).toHaveBeenCalledWith(order, {
      locale: market.locale,
      cartIdOverride: returnedCheckoutOrder.id,
    })
  })

  it('does not persist an order fallback when projection fails', async () => {
    const cartReadError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const projectionError = new Error('order fallback projection failed')
    const order = { id: 'or_123' }
    server.getCart.mockRejectedValue(cartReadError)
    server.isRecoverableCartResponseError.mockReturnValue(true)
    server.updateCart.mockRejectedValue(new Error('cart update unavailable'))
    server.getOrder.mockResolvedValue(order)
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      readCheckoutOrderState({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('does not swallow order fallback persistence failures', async () => {
    const cartReadError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const persistenceError = new Error('order fallback cookie failed')
    const order = { id: 'or_123' }
    server.getCart.mockRejectedValue(cartReadError)
    server.isRecoverableCartResponseError.mockReturnValue(true)
    server.updateCart.mockRejectedValue(new Error('cart update unavailable'))
    server.getOrder.mockResolvedValue(order)
    server.mapCheckout.mockReturnValue(checkoutOrder)
    server.persistCartCookies.mockImplementationOnce(() => {
      throw persistenceError
    })

    await expect(
      readCheckoutOrderState({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toBe(persistenceError)
  })

  it('falls back to the request token when a cart response token is only whitespace', async () => {
    server.getCart.mockResolvedValue({
      id: checkoutOrder.id,
      token: '   ',
    })
    server.mapCheckout.mockReturnValue(checkoutOrder)

    await expect(
      readCheckoutOrderStateWithToken({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
      }),
    ).resolves.toEqual({
      cartToken: 'cart-token',
      persistedCartToken: 'cart-token',
      checkoutOrder,
    })

    expect(server.persistCartCookies).toHaveBeenCalledWith(
      { id: checkoutOrder.id, token: '   ' },
      market,
      {
        expectedCartId: checkoutOrder.id,
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: 'cart-token',
      },
    )
  })

  it('does not fall back to an order when the initial cart projection fails', async () => {
    const projectionError = new Error('checkout projection failed')
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
    expect(server.updateCart).not.toHaveBeenCalled()
    expect(server.getOrder).not.toHaveBeenCalled()
  })

  it('does not fall back to an order when cart cookie persistence fails', async () => {
    const persistenceError = new Error('cart cookie persistence failed')
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.persistCartCookies.mockImplementationOnce(() => {
      throw persistenceError
    })

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toBe(persistenceError)

    expect(server.updateCart).not.toHaveBeenCalled()
    expect(server.getOrder).not.toHaveBeenCalled()
  })

  it('stops after initial cart persistence loses ownership', async () => {
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.persistCartCookies.mockReturnValue(false)

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toMatchObject({
      name: 'CheckoutCartSessionMismatchError',
    })

    expect(server.updateCart).not.toHaveBeenCalled()
    expect(server.getOrder).not.toHaveBeenCalled()
  })

  it.each([
    { total: '0x10' },
    { orders: undefined },
    { orders: null },
    { orders: [null] },
  ])(
    'retains the cart cookie when a completed group response is malformed: %j',
    async (malformedFields) => {
      server.getCart.mockRejectedValue({ status: 404 })
      server.isRecoverableCartResponseError.mockReturnValue(true)
      server.updateCart.mockRejectedValue({ status: 404 })
      server.getOrder.mockResolvedValue({
        ...baseCart,
        id: 'ogrp_fixture',
        number: 'R-fixture',
        currency: 'USD',
        completed_at: '2026-10-14T00:00:00Z',
        fulfillment_status: null,
        payment_status: null,
        orders: [
          {
            ...baseCart,
            id: 'or_one',
            cart_id: null,
            currency: 'USD',
            number: 'R-fixture-1',
            completed_at: '2026-10-14T00:00:00Z',
          },
        ],
        ...malformedFields,
      })
      await expect(
        readCheckoutOrderState({
          cartId: 'cart_123',
          cartToken: 'cart-token',
          market,
        }),
      ).rejects.toThrow('response is malformed')
      expect(
        server.clearCheckoutCartCookiesIfOwnedByCart,
      ).not.toHaveBeenCalled()
    },
  )

  it('rejects an order fallback for another requested order resource', async () => {
    const cartReadError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    server.getCart.mockRejectedValue(cartReadError)
    server.isRecoverableCartResponseError.mockReturnValue(true)
    server.updateCart.mockRejectedValue(new Error('cart update unavailable'))
    server.getOrder.mockResolvedValue({ id: 'or_other' })

    await expect(
      readCheckoutOrderState({
        cartId: 'or_requested',
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toBeInstanceOf(CheckoutOrderResourceIdentityMismatchError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
    expect(server.mapCheckout).not.toHaveBeenCalled()
  })

  it('rejects a cart fallback that is not an order resource', async () => {
    const cartReadError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    server.getCart.mockRejectedValue(cartReadError)
    server.isRecoverableCartResponseError.mockReturnValue(true)
    server.updateCart.mockRejectedValue(new Error('cart update unavailable'))
    server.getOrder.mockResolvedValue({ id: 'cart_other' })

    await expect(
      readCheckoutOrderState({
        cartId: 'cart_requested',
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toBeInstanceOf(CheckoutOrderResourceIdentityMismatchError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
    expect(server.mapCheckout).not.toHaveBeenCalled()
  })

  it('rejects a non-cart response before checkout fallback handling', async () => {
    const typeMismatch = new CartResourceTypeMismatchError()
    const response = { id: 'or_wrong' }
    server.getCart.mockResolvedValue(response)
    server.assertCartIsCart.mockImplementationOnce(() => {
      throw typeMismatch
    })

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.assertCartIsCart).toHaveBeenCalledWith(response)
    expect(server.updateCart).not.toHaveBeenCalled()
    expect(server.getOrder).not.toHaveBeenCalled()
  })

  it('does not project a completed order fallback into active checkout state', async () => {
    const cartReadError = Object.assign(new Error('Cart completed'), {
      status: 404,
    })
    const completedOrder = {
      completed_at: '2026-08-25T10:00:00Z',
      id: 'or_123',
    }
    server.getCart.mockRejectedValue(cartReadError)
    server.updateCart.mockRejectedValue(new Error('cart update unavailable'))
    server.getOrder.mockResolvedValue(completedOrder)

    await expect(
      readCheckoutOrderState({
        cartCookieId: 'cart_123',
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
      }),
    ).resolves.toBeNull()

    expect(server.persistCartCookies).not.toHaveBeenCalled()
    expect(server.mapCheckout).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).toHaveBeenCalledWith(
      'cart_123',
      'cart_123',
      'cart-token',
    )
  })

  it('does not clear another active cart for an explicit completed checkout URL', async () => {
    const cartReadError = Object.assign(new Error('Cart completed'), {
      status: 404,
    })
    server.getCart.mockRejectedValue(cartReadError)
    server.updateCart.mockRejectedValue(new Error('cart update unavailable'))
    server.getOrder.mockResolvedValue({
      completed_at: '2026-08-25T10:00:00Z',
      id: 'or_123',
    })

    await expect(
      readCheckoutOrderState({
        cartCookieId: 'cart_other',
        cartId: 'cart_completed',
        cartToken: 'cart-token',
        market,
      }),
    ).resolves.toBeNull()

    expect(server.clearCheckoutCartCookiesIfOwnedByCart).toHaveBeenCalledWith(
      'cart_completed',
      'cart_other',
      'cart-token',
    )
  })

  it('does not continue with a stale order when Spree rate selection fails', async () => {
    const shippingUpdateError = Object.assign(
      new Error('shipping service unavailable'),
      { status: 422 },
    )
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(checkoutOrder)
    server.fulfillmentsUpdate.mockRejectedValue(shippingUpdateError)

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).rejects.toBe(shippingUpdateError)
  })

  it('uses the latest persisted token when a fulfillment response completes checkout', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: null,
      paymentMethods: [],
    } as unknown as CheckoutOrder
    const completedCart = {
      completed_at: '2026-08-28T10:00:00Z',
      id: checkoutOrder.id,
      token: 'completion-response-token',
    }
    server.getCart.mockResolvedValue({
      id: checkoutOrder.id,
      token: 'persisted-cart-token',
    })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue(completedCart)

    await expect(
      ensureCheckoutShippingRateForPaymentWithToken({
        cartId: checkoutOrder.id,
        cartToken: 'request-cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).resolves.toEqual({
      cartToken: 'completion-response-token',
      persistedCartToken: 'persisted-cart-token',
      checkoutOrder: null,
    })

    expect(server.clearCheckoutCartCookiesIfOwnedByCart).toHaveBeenCalledWith(
      checkoutOrder.id,
      undefined,
      'persisted-cart-token',
    )
  })

  it('uses rotated tokens for shipping mutation and follow-up checkout read', async () => {
    const initialCart = {
      id: checkoutOrder.id,
      token: 'rotated-cart-token',
    }
    const updatedCart = {
      id: checkoutOrder.id,
      token: 'after-rate-cart-token',
    }
    const refreshedCart = {
      id: checkoutOrder.id,
      token: 'final-cart-token',
    }
    server.getCart
      .mockResolvedValueOnce(initialCart)
      .mockResolvedValueOnce(refreshedCart)
    server.mapCheckout.mockReturnValue(checkoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue(updatedCart)

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).resolves.toBe(checkoutOrder)

    expect(server.fulfillmentsUpdate).toHaveBeenCalledWith(
      checkoutOrder.id,
      'fulfillment_123',
      { selected_delivery_rate_id: 'rate_123' },
      { spreeToken: 'rotated-cart-token' },
    )
    expect(server.getCart).toHaveBeenNthCalledWith(2, checkoutOrder.id, {
      spreeToken: 'after-rate-cart-token',
    })
    expect(server.persistCartCookies).toHaveBeenNthCalledWith(
      2,
      updatedCart,
      market,
      {
        expectedCartId: checkoutOrder.id,
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: 'after-rate-cart-token',
      },
    )
    expect(server.persistCartCookies).toHaveBeenNthCalledWith(
      3,
      refreshedCart,
      market,
      {
        expectedCartId: checkoutOrder.id,
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: 'final-cart-token',
      },
    )
  })

  it('preserves the customer token through shipping preparation reads and mutation', async () => {
    const initialCart = {
      id: checkoutOrder.id,
      token: 'rotated-cart-token',
    }
    const updatedCart = {
      id: checkoutOrder.id,
      token: 'after-rate-cart-token',
    }
    const refreshedCart = {
      id: checkoutOrder.id,
      token: 'final-cart-token',
    }
    server.getCart
      .mockResolvedValueOnce(initialCart)
      .mockResolvedValueOnce(refreshedCart)
    server.mapCheckout.mockReturnValue(checkoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue(updatedCart)

    await expect(
      ensureCheckoutShippingRateForPaymentWithToken({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        customerToken: 'refreshed-customer-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).resolves.toMatchObject({ checkoutOrder })

    expect(server.fulfillmentsUpdate).toHaveBeenCalledWith(
      checkoutOrder.id,
      'fulfillment_123',
      { selected_delivery_rate_id: 'rate_123' },
      {
        spreeToken: 'rotated-cart-token',
        token: 'refreshed-customer-token',
      },
    )
    expect(server.getCart).toHaveBeenNthCalledWith(1, checkoutOrder.id, {
      spreeToken: 'cart-token',
      token: 'refreshed-customer-token',
    })
    expect(server.getCart).toHaveBeenNthCalledWith(2, checkoutOrder.id, {
      spreeToken: 'after-rate-cart-token',
      token: 'refreshed-customer-token',
    })
  })

  it('does not persist the shipping response when its projection fails', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: null,
      paymentMethods: [],
    } as unknown as CheckoutOrder
    const projectionError = new Error('shipping response projection failed')
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValueOnce(initialCheckoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue({
      id: checkoutOrder.id,
      token: 'rotated-cart-token',
    })
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCartCookies).toHaveBeenCalledTimes(1)
    expect(server.getCart).toHaveBeenCalledTimes(1)
  })

  it('projects the shipping response before persisting its rotated token', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: null,
      paymentMethods: [],
    } as unknown as CheckoutOrder
    const updatedCart = {
      id: checkoutOrder.id,
      token: 'rotated-cart-token',
    }
    const refreshedCart = {
      id: checkoutOrder.id,
      token: 'final-cart-token',
    }
    server.getCart
      .mockResolvedValueOnce({ id: checkoutOrder.id })
      .mockResolvedValueOnce(refreshedCart)
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue(updatedCart)

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).resolves.toBe(initialCheckoutOrder)

    expect(server.mapCheckout.mock.invocationCallOrder[1]).toBeLessThan(
      server.persistCartCookies.mock.invocationCallOrder[1],
    )
  })

  it('stops before the follow-up checkout read when shipping persistence loses ownership', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: null,
      paymentMethods: [],
    } as unknown as CheckoutOrder
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue({
      id: checkoutOrder.id,
      token: 'rotated-cart-token',
    })
    server.persistCartCookies
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(false)

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).rejects.toMatchObject({
      name: 'CheckoutCartSessionMismatchError',
    })

    expect(server.getCart).toHaveBeenCalledTimes(1)
  })

  it('uses a rotated token for the no-op checkout refresh', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: {
        amount: 100,
        currencyCode: 'USD',
      },
      paymentMethods: [],
      shippingRates: [
        {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
          selected: true,
        },
      ],
    } as unknown as CheckoutOrder
    server.getCart.mockResolvedValue({
      id: checkoutOrder.id,
      token: 'rotated-cart-token',
    })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.updateCart.mockResolvedValue({
      id: checkoutOrder.id,
      token: 'updated-cart-token',
    })
    server.mapCheckout.mockReturnValueOnce(initialCheckoutOrder)
    server.mapCheckout.mockReturnValueOnce(checkoutOrder)

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        refreshWithUpdate: true,
      }),
    ).resolves.toBe(checkoutOrder)

    expect(server.updateCart).toHaveBeenCalledWith(
      checkoutOrder.id,
      {},
      { spreeToken: 'rotated-cart-token' },
    )
    expect(server.persistCartCookies).toHaveBeenNthCalledWith(
      2,
      {
        id: checkoutOrder.id,
        token: 'updated-cart-token',
      },
      market,
      {
        expectedCartId: checkoutOrder.id,
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: 'updated-cart-token',
      },
    )
  })

  it('stops after refreshed cart persistence loses ownership', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: {
        amount: 100,
        currencyCode: 'USD',
      },
      paymentMethods: [],
      shippingRates: [
        {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
          selected: true,
        },
      ],
    } as unknown as CheckoutOrder
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.updateCart.mockResolvedValue({ id: checkoutOrder.id })
    server.persistCartCookies
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(false)

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        refreshWithUpdate: true,
      }),
    ).rejects.toMatchObject({
      name: 'CheckoutCartSessionMismatchError',
    })

    expect(server.getOrder).not.toHaveBeenCalled()
  })

  it('does not fall back to an order when the refreshed cart projection fails', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: {
        amount: 100,
        currencyCode: 'USD',
      },
      paymentMethods: [],
      shippingRates: [],
    } as unknown as CheckoutOrder
    const projectionError = new Error('refreshed checkout projection failed')
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValueOnce(initialCheckoutOrder)
    server.updateCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        refreshWithUpdate: true,
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCartCookies).toHaveBeenCalledTimes(1)
    expect(server.getOrder).not.toHaveBeenCalled()
  })

  it('rejects a non-cart response from the no-op checkout refresh', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: {
        amount: 100,
        currencyCode: 'USD',
      },
      paymentMethods: [],
      shippingRates: [
        {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
          selected: true,
        },
      ],
    } as unknown as CheckoutOrder
    const typeMismatch = new CartResourceTypeMismatchError()
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.updateCart.mockResolvedValue({ id: 'or_wrong' })
    server.assertCartIsCart
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw typeMismatch
      })

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        refreshWithUpdate: true,
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.updateCart).toHaveBeenCalled()
    expect(server.getOrder).not.toHaveBeenCalled()
  })

  it('does not return the initial order after a refresh and fallback both fail', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: {
        amount: 100,
        currencyCode: 'USD',
      },
      paymentMethods: [],
      shippingRates: [],
    } as unknown as CheckoutOrder
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.updateCart.mockRejectedValue(new Error('checkout refresh failed'))
    server.getOrder.mockRejectedValue(new Error('order fallback unavailable'))

    await expect(
      readCheckoutOrderState({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        refreshWithUpdate: true,
      }),
    ).resolves.toBeNull()
  })

  it('rejects a shipping response for another cart before persistence', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: null,
      paymentMethods: [],
    } as unknown as CheckoutOrder
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue({ id: 'cart_other' })

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).rejects.toBeInstanceOf(CartResourceIdentityMismatchError)

    expect(server.persistCartCookies).toHaveBeenCalledTimes(1)
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('rejects a non-cart shipping response before persistence', async () => {
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: null,
      paymentMethods: [],
    } as unknown as CheckoutOrder
    const typeMismatch = new CartResourceTypeMismatchError()
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue({ id: 'or_wrong' })
    server.assertCartIsCart
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw typeMismatch
      })

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.fulfillmentsUpdate).toHaveBeenCalled()
    expect(server.persistCartCookies).toHaveBeenCalledTimes(1)
  })

  it('rejects a shipping response from another market before completion handling', async () => {
    const marketMismatch = new Error('cart belongs to another market')
    const initialCheckoutOrder = {
      ...checkoutOrder,
      amountDue: null,
      paymentMethods: [],
    } as unknown as CheckoutOrder
    server.getCart.mockResolvedValue({ id: checkoutOrder.id })
    server.mapCheckout.mockReturnValue(initialCheckoutOrder)
    server.fulfillmentsUpdate.mockResolvedValue({ id: checkoutOrder.id })
    server.assertCartMarket.mockImplementationOnce(() => undefined)
    server.assertCartMarket.mockImplementationOnce(() => {
      throw marketMismatch
    })

    await expect(
      ensureCheckoutShippingRateForPayment({
        cartId: checkoutOrder.id,
        cartToken: 'cart-token',
        market,
        selectedShippingRate: {
          fulfillmentId: 'fulfillment_123',
          id: 'rate_123',
        },
      }),
    ).rejects.toBe(marketMismatch)

    expect(server.fulfillmentsUpdate).toHaveBeenCalled()
    expect(server.persistCartCookies).toHaveBeenCalledTimes(1)
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })
})
