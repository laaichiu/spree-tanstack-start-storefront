// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { prepareExpressCheckoutPayment } from './checkout-express-payment.functions'

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
  mapCheckout: vi.fn(),
  readCheckoutOrderState: vi.fn(),
  readExpressCheckoutErrorMessage: vi.fn(),
  requireActiveCheckoutOrder: vi.fn((order: unknown) => order),
  requireCheckoutCartCookieStateForCart: vi.fn(),
  resolveServerMarket: vi.fn(),
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

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
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

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: () => ({
    carts: {
      update: server.updateCart,
    },
  }),
}))

vi.mock('./checkout-express-error.server', () => ({
  readExpressCheckoutErrorMessage: server.readExpressCheckoutErrorMessage,
}))

vi.mock('./checkout-express.schemas', () => ({
  prepareExpressCheckoutPaymentInputSchema: {
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
  server.getCheckoutCartRequestOptions.mockReset().mockReturnValue({
    spreeToken: 'cart-token',
  })
  server.withCheckoutCustomerSession.mockReset()
  server.mapCheckout.mockReset()
  server.resolveServerMarket.mockReset().mockReturnValue(market)
  server.requireActiveCheckoutOrder
    .mockReset()
    .mockImplementation((order: unknown) => order)
  server.persistCheckoutCartCookies.mockReset()
})

describe('Express checkout payment preparation', () => {
  it('rejects a cross-market payment response before projection', async () => {
    const marketMismatch = new Error('cart belongs to another market')
    const updatedCart = {
      currency: 'EUR',
      id: 'cart-current',
      market_id: 'market-eu',
      token: 'payment-cart-token',
    }
    server.resolveServerMarket.mockReturnValue(market)
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue(updatedCart)
    server.assertCartMarket.mockImplementation(() => {
      throw marketMismatch
    })

    await expect(
      prepareExpressCheckoutPayment({
        data: {
          billingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
          cartId: 'cart-current',
          email: 'jane@example.com',
          market: { country: 'us', locale: 'en' },
          shippingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
        },
      }),
    ).rejects.toBe(marketMismatch)

    expect(server.assertCartMarket).toHaveBeenCalledWith(updatedCart, market)
    expect(server.mapCheckout).not.toHaveBeenCalled()
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('does not persist a rotated token when payment preparation projection fails', async () => {
    const projectionError = new Error('checkout projection failed')
    const updatedCart = {
      id: 'cart-current',
      token: 'payment-cart-token',
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
      prepareExpressCheckoutPayment({
        data: {
          billingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
          cartId: 'cart-current',
          email: 'jane@example.com',
          market: { country: 'us', locale: 'en' },
          shippingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
        },
      }),
    ).rejects.toBe(projectionError)

    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
  })

  it('uses the token returned by the ownership preflight for the cart update', async () => {
    const order = { id: 'cart-current' }
    server.resolveServerMarket.mockReturnValue(market)
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
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
    server.readCheckoutOrderState.mockResolvedValue(order)

    await expect(
      prepareExpressCheckoutPayment({
        data: {
          billingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
          cartId: 'cart-current',
          email: 'jane@example.com',
          market: { country: 'us', locale: 'en' },
          shippingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
        },
      }),
    ).resolves.toEqual({ order, success: true })

    expect(server.updateCart).toHaveBeenCalledWith(
      'cart-current',
      expect.any(Object),
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
        expectedCurrentCartToken: 'cart-token',
        fallbackToken: 'refreshed-cart-token',
      },
    )
    expect(server.readCheckoutOrderState).toHaveBeenCalledWith({
      cartId: 'cart-current',
      cartToken: 'refreshed-cart-token',
      expectedCurrentCartToken: 'cart-token',
      market,
      refreshWithUpdate: true,
    })
  })

  it('rejects a non-cart response before persistence or refresh', async () => {
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
    server.readExpressCheckoutErrorMessage.mockReturnValue('Payment failed.')

    await expect(
      prepareExpressCheckoutPayment({
        data: {
          billingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
          cartId: 'cart-current',
          email: 'jane@example.com',
          market: { country: 'us', locale: 'en' },
          shippingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
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

  it('stops before checkout refresh when payment persistence loses ownership', async () => {
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(
      'refreshed-cart-token',
    )
    server.updateCart.mockResolvedValue({
      id: 'cart-current',
      token: 'payment-cart-token',
    })
    server.persistCheckoutCartCookies.mockReturnValue(false)

    await expect(
      prepareExpressCheckoutPayment({
        data: {
          billingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
          cartId: 'cart-current',
          email: 'jane@example.com',
          market: { country: 'us', locale: 'en' },
          shippingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
        },
      }),
    ).rejects.toMatchObject({
      name: 'CheckoutCartSessionMismatchError',
    })

    expect(server.persistCheckoutCartCookies).toHaveBeenCalledOnce()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })

  it('maps an express payment mutation failure to a safe result', async () => {
    const mutationError = new Error('address could not be saved')
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockRejectedValue(mutationError)
    server.readExpressCheckoutErrorMessage.mockReturnValue(
      'Address could not be saved.',
    )

    await expect(
      prepareExpressCheckoutPayment({
        data: {
          billingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
          cartId: 'cart-current',
          email: 'jane@example.com',
          market: { country: 'us', locale: 'en' },
          shippingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
        },
      }),
    ).resolves.toEqual({
      error: 'Address could not be saved.',
      success: false,
    })

    expect(server.readExpressCheckoutErrorMessage).toHaveBeenCalledWith(
      mutationError,
      'Unable to prepare express checkout payment.',
    )
    expect(server.persistCheckoutCartCookies).not.toHaveBeenCalled()
  })

  it('propagates a payment persistence failure instead of returning a payment error', async () => {
    const persistenceError = new Error('cart cookie persistence failed')
    server.requireCheckoutCartCookieStateForCart.mockReturnValue({
      cartToken: 'cart-token',
    })
    server.assertCheckoutCartMatchesMarket.mockResolvedValue(undefined)
    server.updateCart.mockResolvedValue({
      id: 'cart-current',
      token: 'payment-cart-token',
    })
    server.persistCheckoutCartCookies.mockImplementation(() => {
      throw persistenceError
    })

    await expect(
      prepareExpressCheckoutPayment({
        data: {
          billingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
          cartId: 'cart-current',
          email: 'jane@example.com',
          market: { country: 'us', locale: 'en' },
          shippingAddress: {
            address1: '1 Main Street',
            city: 'New York',
            country_code: 'US',
            first_name: 'Jane',
            last_name: 'Doe',
            postal_code: '10001',
          },
        },
      }),
    ).rejects.toBe(persistenceError)

    expect(server.readExpressCheckoutErrorMessage).not.toHaveBeenCalled()
    expect(server.readCheckoutOrderState).not.toHaveBeenCalled()
  })
})
