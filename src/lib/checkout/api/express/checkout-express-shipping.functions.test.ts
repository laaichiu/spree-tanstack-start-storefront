// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  resolveExpressCheckoutShipping,
  selectExpressCheckoutShippingRates,
} from './checkout-express-shipping.functions'

const server = vi.hoisted(() => ({
  assertCartIsCart: vi.fn(),
  assertCartMatchesId: vi.fn(),
  assertCartMarket: vi.fn(),
  assertCheckoutCartMatchesMarket: vi.fn(),
  CheckoutCartSessionMismatchError: class extends Error {
    constructor() {
      super('This checkout session no longer matches the active cart.')
      this.name = 'CheckoutCartSessionMismatchError'
    }
  },
  getCheckoutCartRequestOptions: vi.fn((cartToken?: string) => ({
    spreeToken: cartToken?.trim() || 'cart-token',
  })),
  getCheckoutResourceToken: vi.fn(
    (resource: { token?: unknown }, fallbackToken?: string) => {
      const token =
        typeof resource.token === 'string' ? resource.token.trim() : ''

      return token || fallbackToken?.trim()
    },
  ),
  getCartCookieState: vi.fn(),
  mapCheckout: vi.fn(),
  readCheckoutOrderState: vi.fn(),
  readExpressCheckoutErrorMessage: vi.fn(),
  requireActiveCheckoutOrder: vi.fn(),
  requireCheckoutCartCookieStateForCart: vi.fn(),
  resolveServerMarket: vi.fn(),
  updateShipping: vi.fn(),
  updateCart: vi.fn(),
  persistCheckoutCartCookies: vi.fn(),
  withCheckoutCustomerSession: vi.fn(),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      handler:
        (handler: (options: { data: unknown }) => unknown) =>
        async (options: { data: unknown }) =>
          handler(options),
      validator: () => builder,
    }

    return builder
  },
}))

vi.mock('@/lib/cart/utils/cart-identity', () => ({
  assertCartResourceIsCart: server.assertCartIsCart,
  assertCartResourceMatchesId: server.assertCartMatchesId,
}))

vi.mock('@/lib/cart/utils/cart-market', () => ({
  assertSpreeCartResourceMatchesMarket: server.assertCartMarket,
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: server.mapCheckout,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: () => ({
    carts: {
      fulfillments: {
        update: server.updateShipping,
      },
      update: server.updateCart,
    },
  }),
}))

vi.mock('./checkout-express-error.server', () => ({
  readExpressCheckoutErrorMessage: server.readExpressCheckoutErrorMessage,
}))

vi.mock('./checkout-express.schemas', () => ({
  expressCheckoutPartialAddressInputSchema: {
    parse: (data: unknown) => data,
  },
  selectExpressCheckoutShippingRatesInputSchema: {
    parse: (data: unknown) => data,
  },
}))

vi.mock('../checkout-order-state.server', () => ({
  readCheckoutOrderState: server.readCheckoutOrderState,
  requireActiveCheckoutOrder: server.requireActiveCheckoutOrder,
}))

vi.mock('../checkout-session.server', () => ({
  assertCheckoutCartMatchesMarket: server.assertCheckoutCartMatchesMarket,
  CheckoutCartSessionMismatchError: server.CheckoutCartSessionMismatchError,
  getCheckoutCartRequestOptions: server.getCheckoutCartRequestOptions,
  getCheckoutResourceToken: server.getCheckoutResourceToken,
  persistCheckoutCartCookies: server.persistCheckoutCartCookies,
  requireCheckoutCartCookieStateForCart:
    server.requireCheckoutCartCookieStateForCart,
  withCheckoutCustomerSession: server.withCheckoutCustomerSession,
}))

beforeEach(() => {
  server.withCheckoutCustomerSession.mockImplementation(({ operation }) =>
    operation(),
  )
})

afterEach(() => {
  vi.clearAllMocks()
  server.assertCartIsCart.mockReset()
  server.assertCartMatchesId.mockReset()
  server.assertCartMarket.mockReset()
  server.assertCheckoutCartMatchesMarket.mockReset()
  server.getCheckoutCartRequestOptions.mockReset().mockReturnValue({
    spreeToken: 'cart-token',
  })
  server.withCheckoutCustomerSession.mockReset()
  server.mapCheckout.mockReset()
  server.readExpressCheckoutErrorMessage.mockReset()
  server.requireCheckoutCartCookieStateForCart.mockReset()
  server.resolveServerMarket.mockReset().mockReturnValue(market)
  server.updateShipping.mockReset()
  server.updateCart.mockReset()
  server.persistCheckoutCartCookies.mockReset().mockReturnValue(true)
})

describe('Express shipping response ownership', () => {
  it('rejects a cross-market partial-address response before projection', async () => {
    const marketMismatch = new Error('cart belongs to another market')
    const updatedCart = {
      currency: 'EUR',
      id: 'cart-current',
      market_id: 'market-eu',
      token: 'shipping-cart-token',
    }
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.resolveServerMarket.mockReturnValue(market)
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue(updatedCart)
    server.assertCartMarket.mockImplementation(() => {
      throw marketMismatch
    })

    await expect(
      resolveExpressCheckoutShipping({
        data: {
          address: {
            city: 'New York',
            countryIso: 'US',
            postalCode: '10001',
          },
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(marketMismatch)

    expect(server.assertCartMarket).toHaveBeenCalledWith(updatedCart, market)
    expect(server.mapCheckout).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
  })

  it('does not persist a rotated token when partial shipping projection fails', async () => {
    const projectionError = new Error('checkout projection failed')
    const updatedCart = {
      id: 'cart-current',
      token: 'shipping-cart-token',
    }
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue(updatedCart)
    server.mapCheckout.mockImplementation(() => {
      throw projectionError
    })

    await expect(
      resolveExpressCheckoutShipping({
        data: {
          address: {
            city: 'New York',
            countryIso: 'US',
            postalCode: '10001',
          },
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
  })

  it('does not persist a rotated token when a selected rate projection fails', async () => {
    const projectionError = new Error('checkout projection failed')
    const updatedCart = {
      id: 'cart-current',
      token: 'shipping-cart-token',
    }
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateShipping.mockResolvedValue(updatedCart)
    server.mapCheckout.mockImplementation(() => {
      throw projectionError
    })

    await expect(
      selectExpressCheckoutShippingRates({
        data: {
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
          selections: [
            {
              fulfillmentId: 'fulfillment-1',
              rateId: 'rate-1',
            },
          ],
        },
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
  })

  it('carries a rotated token through partial shipping persistence and refresh', async () => {
    const updatedCart = {
      id: 'cart-current',
      token: 'shipping-cart-token',
    }
    const order = { id: 'cart-current' }
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.resolveServerMarket.mockReturnValue(market)
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string) => ({
        spreeToken: cartToken ?? 'cart-token',
      }),
    )
    server.updateCart.mockResolvedValue(updatedCart)
    server.readCheckoutOrderState.mockResolvedValue(order)
    server.requireActiveCheckoutOrder.mockReturnValue(order)

    await expect(
      resolveExpressCheckoutShipping({
        data: {
          address: {
            city: 'New York',
            countryIso: 'US',
            postalCode: '10001',
          },
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).resolves.toEqual({ order, success: true })

    expect(server.persistCheckoutCartCookies).toHaveBeenCalledWith(
      updatedCart,
      market,
      {
        expectedCartId: 'cart-current',
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: 'refreshed-cart-token',
      },
    )
    expect(server.readCheckoutOrderState).toHaveBeenCalledWith({
      cartId: 'cart-current',
      cartToken: 'shipping-cart-token',
      expectedCurrentCartToken: 'cart-token',
      market,
      refreshWithUpdate: true,
    })
  })

  it('stops before checkout refresh when partial shipping persistence loses ownership', async () => {
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.updateCart.mockResolvedValue({
      id: 'cart-current',
      token: 'shipping-cart-token',
    })
    server.persistCheckoutCartCookies.mockReturnValue(false)

    await expect(
      resolveExpressCheckoutShipping({
        data: {
          address: {
            city: 'New York',
            countryIso: 'US',
            postalCode: '10001',
          },
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toMatchObject({
      name: 'CheckoutCartSessionMismatchError',
    })

    expect(server.persistCheckoutCartCookies).toHaveBeenCalledOnce()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('maps an express shipping mutation failure to a safe result', async () => {
    const mutationError = new Error('shipping method is unavailable')
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockRejectedValue(mutationError)
    server.readExpressCheckoutErrorMessage.mockReturnValue(
      'Shipping method is unavailable.',
    )

    await expect(
      resolveExpressCheckoutShipping({
        data: {
          address: {
            city: 'New York',
            countryIso: 'US',
            postalCode: '10001',
          },
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).resolves.toEqual({
      error: 'Shipping method is unavailable.',
      success: false,
    })

    expect(server.readExpressCheckoutErrorMessage).toHaveBeenCalledWith(
      mutationError,
      'Unable to resolve express checkout shipping.',
    )
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
  })

  it('propagates a persistence failure instead of returning a shipping error', async () => {
    const persistenceError = new Error('cart cookie persistence failed')
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue({
      id: 'cart-current',
      token: 'shipping-cart-token',
    })
    server.persistCheckoutCartCookies.mockImplementation(() => {
      throw persistenceError
    })

    await expect(
      resolveExpressCheckoutShipping({
        data: {
          address: {
            city: 'New York',
            countryIso: 'US',
            postalCode: '10001',
          },
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(persistenceError)

    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('rejects a response for another cart before changing the owner', async () => {
    const identityMismatch = new Error('cart response identity mismatch')
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateShipping.mockResolvedValue({
      id: 'cart-other',
      token: 'other-token',
    })
    server.assertCartMatchesId.mockImplementation(() => {
      throw identityMismatch
    })
    server.readExpressCheckoutErrorMessage.mockReturnValue('Shipping failed.')

    await expect(
      selectExpressCheckoutShippingRates({
        data: {
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
          selections: [
            {
              fulfillmentId: 'fulfillment-1',
              rateId: 'rate-1',
            },
          ],
        },
      }),
    ).rejects.toBe(identityMismatch)

    expect(server.assertCartMatchesId).toHaveBeenCalledWith(
      { id: 'cart-other', token: 'other-token' },
      'cart-current',
    )
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('rejects a non-cart partial-address response before changing the owner', async () => {
    const typeMismatch = new Error('response is not a cart')
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue({
      id: 'or_completed-order',
      token: 'order-token',
    })
    server.assertCartIsCart.mockImplementation(() => {
      throw typeMismatch
    })
    server.readExpressCheckoutErrorMessage.mockReturnValue('Shipping failed.')

    await expect(
      resolveExpressCheckoutShipping({
        data: {
          address: {
            city: 'New York',
            countryIso: 'US',
            postalCode: '10001',
          },
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.assertCartIsCart).toHaveBeenCalledWith({
      id: 'or_completed-order',
      token: 'order-token',
    })
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
    expect(server.assertCartMatchesId).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('rejects a non-cart fulfillment response before changing the owner', async () => {
    const typeMismatch = new Error('response is not a cart')
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateShipping.mockResolvedValue({
      id: 'or_completed-order',
      token: 'order-token',
    })
    server.assertCartIsCart.mockImplementation(() => {
      throw typeMismatch
    })
    server.readExpressCheckoutErrorMessage.mockReturnValue('Shipping failed.')

    await expect(
      selectExpressCheckoutShippingRates({
        data: {
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
          selections: [
            {
              fulfillmentId: 'fulfillment-1',
              rateId: 'rate-1',
            },
          ],
        },
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.assertCartIsCart).toHaveBeenCalledWith({
      id: 'or_completed-order',
      token: 'order-token',
    })
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
    expect(server.assertCartMatchesId).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('stops a multi-selection when the cookie owner changes between rates', async () => {
    const staleOwner = new Error('checkout cart session changed')
    let guardCalls = 0
    server.requireCheckoutCartCookieStateForCart.mockImplementation(() => {
      guardCalls += 1
      if (guardCalls === 4) {
        throw staleOwner
      }

      return { cartToken: 'cart-token' }
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateShipping.mockResolvedValue({
      id: 'cart-current',
      token: 'cart-token',
    })
    server.readExpressCheckoutErrorMessage.mockReturnValue('Shipping failed.')

    await expect(
      selectExpressCheckoutShippingRates({
        data: {
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
          selections: [
            {
              fulfillmentId: 'fulfillment-1',
              rateId: 'rate-1',
            },
            {
              fulfillmentId: 'fulfillment-2',
              rateId: 'rate-2',
            },
          ],
        },
      }),
    ).rejects.toBe(staleOwner)

    expect(server.updateShipping).toHaveBeenCalledTimes(1)
    expect(server.persistCheckoutCartCookies).toHaveBeenCalledTimes(1)
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
    expect(server.requireCheckoutCartCookieStateForCart).toHaveBeenCalledTimes(
      4,
    )
  })

  it('uses the token returned by the ownership preflight for the first rate', async () => {
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'refreshed-cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string) => ({
        spreeToken: cartToken ?? 'cart-token',
      }),
    )
    server.updateShipping.mockResolvedValue({
      id: 'cart-current',
      token: 'refreshed-cart-token',
    })
    server.readCheckoutOrderState.mockResolvedValue({ id: 'cart-current' })
    server.requireActiveCheckoutOrder.mockReturnValue({ id: 'cart-current' })

    await selectExpressCheckoutShippingRates({
      data: {
        cartId: 'cart-current',
        market: { country: 'us', locale: 'en' },
        selections: [
          {
            fulfillmentId: 'fulfillment-1',
            rateId: 'rate-1',
          },
        ],
      },
    })

    expect(server.updateShipping).toHaveBeenCalledWith(
      'cart-current',
      'fulfillment-1',
      { selected_delivery_rate_id: 'rate-1' },
      { spreeToken: 'refreshed-cart-token' },
    )
    expect(server.persistCheckoutCartCookies).toHaveBeenCalledWith(
      {
        id: 'cart-current',
        token: 'refreshed-cart-token',
      },
      market,
      {
        expectedCartId: 'cart-current',
        expectedCurrentCartToken: 'refreshed-cart-token',
        fallbackToken: 'refreshed-cart-token',
      },
    )
    expect(server.readCheckoutOrderState).toHaveBeenCalledWith({
      cartId: 'cart-current',
      cartToken: 'refreshed-cart-token',
      expectedCurrentCartToken: 'refreshed-cart-token',
      market,
      refreshWithUpdate: true,
    })
  })

  it('uses each response token for the next rate selection', async () => {
    let ownerCheckCount = 0
    const firstCartToken = 'first-rate-cart-token'
    const secondCartToken = 'second-rate-cart-token'
    server.requireCheckoutCartCookieStateForCart.mockImplementation(() => {
      ownerCheckCount += 1

      return { cartToken: 'cart-token' }
    })
    server.resolveServerMarket.mockReturnValue(market)
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string) => ({
        spreeToken: cartToken ?? 'cart-token',
      }),
    )
    server.updateShipping
      .mockResolvedValueOnce({
        id: 'cart-current',
        token: firstCartToken,
      })
      .mockResolvedValueOnce({
        id: 'cart-current',
        token: secondCartToken,
      })
    server.readCheckoutOrderState.mockResolvedValue({ id: 'cart-current' })
    server.requireActiveCheckoutOrder.mockReturnValue({ id: 'cart-current' })

    await selectExpressCheckoutShippingRates({
      data: {
        cartId: 'cart-current',
        market: { country: 'us', locale: 'en' },
        selections: [
          {
            fulfillmentId: 'fulfillment-1',
            rateId: 'rate-1',
          },
          {
            fulfillmentId: 'fulfillment-2',
            rateId: 'rate-2',
          },
        ],
      },
    })

    expect(server.updateShipping).toHaveBeenNthCalledWith(
      1,
      'cart-current',
      'fulfillment-1',
      { selected_delivery_rate_id: 'rate-1' },
      { spreeToken: 'refreshed-cart-token' },
    )
    expect(server.updateShipping).toHaveBeenNthCalledWith(
      2,
      'cart-current',
      'fulfillment-2',
      { selected_delivery_rate_id: 'rate-2' },
      { spreeToken: firstCartToken },
    )
    expect(server.persistCheckoutCartCookies).toHaveBeenNthCalledWith(
      1,
      {
        id: 'cart-current',
        token: firstCartToken,
      },
      market,
      {
        expectedCartId: 'cart-current',
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: firstCartToken,
      },
    )
    expect(server.persistCheckoutCartCookies).toHaveBeenNthCalledWith(
      2,
      {
        id: 'cart-current',
        token: secondCartToken,
      },
      market,
      {
        expectedCartId: 'cart-current',
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: secondCartToken,
      },
    )
    expect(server.readCheckoutOrderState).toHaveBeenCalledWith({
      cartId: 'cart-current',
      cartToken: secondCartToken,
      expectedCurrentCartToken: secondCartToken,
      market,
      refreshWithUpdate: true,
    })
  })

  it('stops before the next rate when cookie persistence loses ownership', async () => {
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateShipping.mockResolvedValue({
      id: 'cart-current',
      token: 'rotated-cart-token',
    })
    server.persistCheckoutCartCookies.mockReturnValue(false)

    await expect(
      selectExpressCheckoutShippingRates({
        data: {
          cartId: 'cart-current',
          market: { country: 'us', locale: 'en' },
          selections: [
            {
              fulfillmentId: 'fulfillment-1',
              rateId: 'rate-1',
            },
            {
              fulfillmentId: 'fulfillment-2',
              rateId: 'rate-2',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      name: 'CheckoutCartSessionMismatchError',
    })

    expect(server.updateShipping).toHaveBeenCalledTimes(1)
    expect(server.getCheckoutCartRequestOptions).toHaveBeenCalledWith(
      'cart-token',
    )
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).toHaveBeenCalledTimes(1)
  })
})
