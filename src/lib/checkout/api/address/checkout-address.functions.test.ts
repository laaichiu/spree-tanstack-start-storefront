// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  selectCheckoutShippingRate,
  updateCheckoutAddress,
  updateCheckoutBillingAddress,
} from './checkout-address.functions'

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
  clearCartCookies: vi.fn(),
  clearCartCookiesIfCurrentCartMatches: vi.fn(),
  fulfillmentsUpdate: vi.fn(),
  getCheckoutCartCookieStateForMarket: vi.fn(),
  getCheckoutCartRequestOptions: vi.fn(
    (cartToken?: string, customerToken?: string) => ({
      spreeToken: cartToken?.trim() || 'cart-token',
      ...(customerToken?.trim() ? { token: customerToken.trim() } : {}),
    }),
  ),
  getCheckoutResourceToken: vi.fn(
    (resource: { token?: unknown }, fallbackToken?: string) => {
      const token =
        typeof resource.token === 'string' ? resource.token.trim() : ''

      return token || fallbackToken?.trim()
    },
  ),
  isRecoverableCartCookieError: vi.fn(() => false),
  mapCheckout: vi.fn(),
  persistCheckoutCartCookies: vi.fn(),
  readCheckoutOrderState: vi.fn(),
  requireCheckoutCartCookieStateForCart: vi.fn(() => ({
    cartId: 'cart-current',
    cartToken: 'cart-token',
  })),
  requireActiveCheckoutOrder: vi.fn((order: unknown) => {
    if (!order) {
      throw new Error('Checkout is no longer available.')
    }

    return order
  }),
  resolveServerMarket: vi.fn(),
  updateCart: vi.fn(),
  withCheckoutCustomerSession: vi.fn(),
}))

const market = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'US Dollar',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'market-us',
  marketName: 'United States',
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

vi.mock('./checkout-address.schemas', () => ({
  updateCheckoutAddressInputSchema: {
    parse: (data: unknown) => data,
  },
  updateCheckoutBillingAddressInputSchema: {
    parse: (data: unknown) => data,
  },
}))

vi.mock('../shipping/checkout-shipping.schemas', () => ({
  selectCheckoutShippingRateInputSchema: {
    parse: (data: unknown) => data,
  },
}))

vi.mock('@/lib/cart/utils/cart-errors', () => ({
  isRecoverableCartCookieError: server.isRecoverableCartCookieError,
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

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: server.clearCartCookies,
  clearCartCookiesIfCurrentCartMatches:
    server.clearCartCookiesIfCurrentCartMatches,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: () => ({
    carts: {
      fulfillments: {
        update: server.fulfillmentsUpdate,
      },
      update: server.updateCart,
    },
  }),
}))

vi.mock('../checkout-order-state.server', () => ({
  readCheckoutOrderState: server.readCheckoutOrderState,
  requireActiveCheckoutOrder: server.requireActiveCheckoutOrder,
}))

vi.mock('../checkout-session.server', () => ({
  assertCheckoutCartMatchesMarket: server.assertCheckoutCartMatchesMarket,
  CheckoutCartSessionMismatchError: server.CheckoutCartSessionMismatchError,
  getCheckoutCartCookieStateForMarket:
    server.getCheckoutCartCookieStateForMarket,
  getCheckoutCartRequestOptions: server.getCheckoutCartRequestOptions,
  getCheckoutResourceToken: server.getCheckoutResourceToken,
  persistCheckoutCartCookies: server.persistCheckoutCartCookies,
  requireCheckoutCartCookieStateForCart:
    server.requireCheckoutCartCookieStateForCart,
  withCheckoutCustomerSession: server.withCheckoutCustomerSession,
}))

beforeEach(() => {
  vi.clearAllMocks()
  server.assertCartIsCart.mockReset()
  server.assertCartMatchesId.mockReset()
  server.assertCartMarket.mockReset()
  server.getCheckoutCartCookieStateForMarket.mockReset()
  server.isRecoverableCartCookieError.mockReset().mockReturnValue(false)
  server.mapCheckout.mockReset()
  server.resolveServerMarket.mockReset().mockReturnValue(market)
  server.getCheckoutCartRequestOptions.mockReset().mockReturnValue({
    spreeToken: 'cart-token',
  })
  server.withCheckoutCustomerSession
    .mockReset()
    .mockImplementation(({ operation }) => operation())
  server.fulfillmentsUpdate.mockReset()
  server.updateCart.mockReset()
  server.persistCheckoutCartCookies.mockReset().mockReturnValue(true)
})

describe('checkout address recovery ownership', () => {
  it('does not treat a completed mutation response as active checkout', async () => {
    const updatedCart = {
      id: 'cart-current',
      token: 'cart-token',
    }
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue(updatedCart)
    server.readCheckoutOrderState.mockResolvedValue(null)

    await expect(
      updateCheckoutAddress({
        data: {
          address: {
            address1: '1 Main Street',
            city: 'New York',
            countryIso: 'US',
            firstName: 'Jane',
            lastName: 'Doe',
            postalCode: '10001',
            stateAbbr: 'NY',
          },
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toThrow('Checkout is no longer available.')

    expect(server.mapCheckout).toHaveBeenCalledWith(updatedCart, {
      locale: 'en',
    })
  })

  it('does not persist a rotated token when address projection fails', async () => {
    const projectionError = new Error('checkout projection failed')
    const updatedCart = {
      id: 'cart-current',
      token: 'rotated-cart-token',
    }
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue(updatedCart)
    server.mapCheckout.mockImplementation(() => {
      throw projectionError
    })

    await expect(
      updateCheckoutAddress({
        data: {
          address: {
            address1: '1 Main Street',
            city: 'New York',
            countryIso: 'US',
            firstName: 'Jane',
            lastName: 'Doe',
            postalCode: '10001',
            stateAbbr: 'NY',
          },
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('rejects a cross-market address response before projection', async () => {
    const marketMismatch = new Error('cart belongs to another market')
    const updatedCart = {
      currency: 'EUR',
      id: 'cart-current',
      market_id: 'market-eu',
      token: 'rotated-cart-token',
    }
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue(updatedCart)
    server.assertCartMarket.mockImplementation(() => {
      throw marketMismatch
    })

    await expect(
      updateCheckoutAddress({
        data: {
          address: {
            address1: '1 Main Street',
            city: 'New York',
            countryIso: 'US',
            firstName: 'Jane',
            lastName: 'Doe',
            postalCode: '10001',
            stateAbbr: 'NY',
          },
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(marketMismatch)

    expect(server.assertCartMarket).toHaveBeenCalledWith(updatedCart, market)
    expect(server.mapCheckout).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('rejects a non-cart address response before persistence or refresh', async () => {
    const typeMismatch = new Error('response is not a cart')
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
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

    await expect(
      updateCheckoutAddress({
        data: {
          address: {
            address1: '1 Main Street',
            city: 'New York',
            countryIso: 'US',
            firstName: 'Jane',
            lastName: 'Doe',
            postalCode: '10001',
            stateAbbr: 'NY',
          },
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.assertCartIsCart).toHaveBeenCalledWith({
      id: 'or_completed-order',
      token: 'order-token',
    })
    expect(server.assertCartMatchesId).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('rejects a non-cart shipping response before persistence or refresh', async () => {
    const typeMismatch = new Error('response is not a cart')
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.fulfillmentsUpdate.mockResolvedValue({
      id: 'or_completed-order',
      token: 'order-token',
    })
    server.assertCartIsCart.mockImplementation(() => {
      throw typeMismatch
    })

    await expect(
      selectCheckoutShippingRate({
        data: {
          cartId: 'cart-current',
          deliveryRateId: 'rate-current',
          fulfillmentId: 'fulfillment-current',
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.assertCartIsCart).toHaveBeenCalledWith({
      id: 'or_completed-order',
      token: 'order-token',
    })
    expect(server.assertCartMatchesId).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('uses the token returned by the ownership preflight for the address mutation', async () => {
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string) => ({
        spreeToken: cartToken ?? 'cart-token',
      }),
    )
    server.updateCart.mockResolvedValue({
      id: 'cart-current',
      token: 'refreshed-cart-token',
    })
    server.readCheckoutOrderState.mockResolvedValue({ id: 'cart-current' })

    await updateCheckoutAddress({
      data: {
        address: {
          address1: '1 Main Street',
          city: 'New York',
          countryIso: 'US',
          firstName: 'Jane',
          lastName: 'Doe',
          postalCode: '10001',
          stateAbbr: 'NY',
        },
        market: { country: 'us', locale: 'en' },
      },
    })

    expect(server.updateCart).toHaveBeenCalledWith(
      'cart-current',
      expect.any(Object),
      { spreeToken: 'refreshed-cart-token' },
    )
  })

  it('uses the refreshed customer session for address preflight and mutation', async () => {
    const clientToken = 'refreshed-customer-token'
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'cart-token',
    })
    server.withCheckoutCustomerSession.mockImplementation(({ operation }) =>
      operation(clientToken),
    )
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string, customerToken?: string) => ({
        spreeToken: cartToken ?? 'cart-token',
        ...(customerToken ? { token: customerToken } : {}),
      }),
    )
    server.updateCart.mockResolvedValue({
      id: 'cart-current',
      token: 'refreshed-cart-token',
    })
    server.readCheckoutOrderState.mockResolvedValue({ id: 'cart-current' })

    await updateCheckoutAddress({
      data: {
        address: {
          address1: '1 Main Street',
          city: 'New York',
          countryIso: 'US',
          firstName: 'Jane',
          lastName: 'Doe',
          postalCode: '10001',
          stateAbbr: 'NY',
        },
        market: { country: 'us', locale: 'en' },
      },
    })

    expect(server.assertCheckoutCartMatchesMarket).toHaveBeenCalledWith({
      cartId: 'cart-current',
      cartToken: 'cart-token',
      client: expect.any(Object),
      customerToken: clientToken,
      market,
    })
    expect(server.updateCart).toHaveBeenCalledWith(
      'cart-current',
      expect.any(Object),
      {
        spreeToken: 'refreshed-cart-token',
        token: clientToken,
      },
    )
  })

  it('carries rotated tokens through address persistence and refresh', async () => {
    const updatedCart = {
      id: 'cart-current',
      token: 'mutation-cart-token',
    }
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.updateCart.mockResolvedValue(updatedCart)
    server.readCheckoutOrderState.mockResolvedValue({ id: 'cart-current' })

    await updateCheckoutAddress({
      data: {
        address: {
          address1: '1 Main Street',
          city: 'New York',
          countryIso: 'US',
          firstName: 'Jane',
          lastName: 'Doe',
          postalCode: '10001',
          stateAbbr: 'NY',
        },
        market: { country: 'us', locale: 'en' },
      },
    })

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
      cartToken: 'mutation-cart-token',
      expectedCurrentCartToken: 'cart-token',
      market,
      refreshWithUpdate: true,
    })
  })

  it('stops before checkout refresh when address persistence loses ownership', async () => {
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.updateCart.mockResolvedValue({
      id: 'cart-current',
      token: 'mutation-cart-token',
    })
    server.persistCheckoutCartCookies.mockReturnValue(false)

    await expect(
      updateCheckoutAddress({
        data: {
          address: {
            address1: '1 Main Street',
            city: 'New York',
            countryIso: 'US',
            firstName: 'Jane',
            lastName: 'Doe',
            postalCode: '10001',
            stateAbbr: 'NY',
          },
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toMatchObject({
      name: 'CheckoutCartSessionMismatchError',
    })

    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).toHaveBeenCalledOnce()
  })

  it('carries a rotated token through billing-address persistence and refresh', async () => {
    const updatedCart = {
      id: 'cart-current',
      token: 'billing-cart-token',
    }
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.updateCart.mockResolvedValue(updatedCart)
    server.readCheckoutOrderState.mockResolvedValue({ id: 'cart-current' })

    await updateCheckoutBillingAddress({
      data: {
        billingAddress: {
          address1: '1 Main Street',
          city: 'New York',
          countryIso: 'US',
          firstName: 'Jane',
          lastName: 'Doe',
          postalCode: '10001',
          stateAbbr: 'NY',
        },
        cartId: 'cart-current',
        market: { country: 'us', locale: 'en' },
        useShipping: false,
      },
    })

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
      cartToken: 'billing-cart-token',
      expectedCurrentCartToken: 'cart-token',
      market,
      refreshWithUpdate: true,
    })
  })

  it('carries a rotated token through shipping-rate persistence and refresh', async () => {
    const updatedCart = {
      id: 'cart-current',
      token: 'shipping-cart-token',
    }
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.fulfillmentsUpdate.mockResolvedValue(updatedCart)
    server.readCheckoutOrderState.mockResolvedValue({ id: 'cart-current' })

    await selectCheckoutShippingRate({
      data: {
        cartId: 'cart-current',
        deliveryRateId: 'rate-current',
        fulfillmentId: 'fulfillment-current',
        market: { country: 'us', locale: 'en' },
      },
    })

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

  it('uses the request-start token when address preflight fails recoverably', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-old',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockRejectedValue(recoverableError)
    server.isRecoverableCartCookieError.mockReturnValue(true)

    await expect(
      updateCheckoutAddress({
        data: {
          address: {
            address1: '1 Main Street',
            city: 'New York',
            countryIso: 'US',
            firstName: 'Jane',
            lastName: 'Doe',
            postalCode: '10001',
            stateAbbr: 'NY',
          },
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(recoverableError)

    expect(server.clearCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      'cart-old',
      'cart-token',
    )
    expect(server.updateCart).not.toHaveBeenCalled()
  })

  it('does not clear a newer cart after an implicit recoverable address error', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    server.getCheckoutCartCookieStateForMarket.mockReturnValue({
      cartId: 'cart-old',
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'validated-cart-token',
    )
    server.updateCart.mockRejectedValue(recoverableError)
    server.isRecoverableCartCookieError.mockReturnValue(true)

    await expect(
      updateCheckoutAddress({
        data: {
          address: {
            address1: '1 Main Street',
            city: 'New York',
            countryIso: 'US',
            firstName: 'Jane',
            lastName: 'Doe',
            postalCode: '10001',
            stateAbbr: 'NY',
          },
          market: { country: 'us', locale: 'en' },
        },
      }),
    ).rejects.toBe(recoverableError)

    expect(server.clearCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      'cart-old',
      'validated-cart-token',
    )
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })
})
