// @vitest-environment node

import type { Client } from '@spree/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutMarket } from './checkout-session.server'
import {
  CartResourceIdentityMismatchError,
  CartResourceTypeMismatchError,
} from '@/lib/cart/utils/cart-identity'
import {
  assertCheckoutCartMatchesMarket,
  clearCheckoutCartCookiesIfOwnedByCart,
  CheckoutCartSessionMismatchError,
  getCheckoutCartRequestOptions,
  getCheckoutCartCookieStateForMarket,
  persistCheckoutCartCookies,
  requireCheckoutCustomerCartAssociation,
  requireCheckoutCartCookieStateForCart,
  withCheckoutCustomerSession,
} from './checkout-session.server'

const server = vi.hoisted(() => ({
  assertCartMarket: vi.fn(),
  clearCartCookies: vi.fn(),
  getCustomerAccessToken: vi.fn(() => undefined as string | undefined),
  getCustomerRefreshToken: vi.fn(() => undefined as string | undefined),
  getCartCookieState: vi.fn(),
  isCartCookieStateIncomplete: vi.fn(() => false),
  isCartMarketKeyCompatible: vi.fn(() => true),
  mapCheckout: vi.fn(),
  normalizeCartToken: vi.fn((token: string | undefined) => token?.trim()),
  setCartCookies: vi.fn(),
  setCartCookiesIfCurrentCartMatches: vi.fn(),
  withCustomerSession: vi.fn(),
}))

vi.mock('@/lib/cart/utils/cart-market', () => ({
  CartMarketMismatchError: class CartMarketMismatchError extends Error {},
  assertSpreeCartResourceMatchesMarket: server.assertCartMarket,
  getCartMarketKey: vi.fn(() => 'market:market-us'),
  isCartMarketKeyCompatibleWithMarket: server.isCartMarketKeyCompatible,
}))

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: server.getCustomerAccessToken,
  getCustomerRefreshToken: server.getCustomerRefreshToken,
}))

vi.mock('@/lib/account/api/customer-session.server', () => ({
  withCustomerSession: server.withCustomerSession,
}))

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: server.clearCartCookies,
  getCartCookieState: server.getCartCookieState,
  isCartCookieStateIncomplete: server.isCartCookieStateIncomplete,
  normalizeCartToken: server.normalizeCartToken,
  setCartCookiesIfCurrentCart: server.setCartCookies,
  setCartCookiesIfCurrentCartMatches: server.setCartCookiesIfCurrentCartMatches,
}))

vi.mock('../mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: server.mapCheckout,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
} satisfies CheckoutMarket

const cart = { id: 'cart_us', market_id: 'market-us' }

afterEach(() => {
  vi.clearAllMocks()
  server.clearCartCookies.mockReset()
  server.getCustomerAccessToken.mockReset().mockReturnValue(undefined)
  server.getCustomerRefreshToken.mockReset().mockReturnValue(undefined)
  server.withCustomerSession.mockReset()
  server.getCartCookieState.mockReset()
  server.isCartCookieStateIncomplete.mockReset().mockReturnValue(false)
  server.isCartMarketKeyCompatible.mockReset().mockReturnValue(true)
  server.normalizeCartToken
    .mockReset()
    .mockImplementation((token: string | undefined) => token?.trim())
  server.assertCartMarket.mockReset()
  server.mapCheckout.mockReset()
  server.setCartCookiesIfCurrentCartMatches.mockReset()
})

describe('getCheckoutCartCookieStateForMarket', () => {
  it('rejects and clears a partial cart cookie session', () => {
    server.getCartCookieState.mockReturnValue({
      cartId: undefined,
      cartMarketKey: 'market:market-us',
      cartToken: 'orphan-token',
    })
    server.isCartCookieStateIncomplete.mockReturnValue(true)

    expect(() =>
      requireCheckoutCartCookieStateForCart(market, 'cart-current'),
    ).toThrow(CheckoutCartSessionMismatchError)
    expect(server.clearCartCookies).toHaveBeenCalledOnce()
  })

  it('rejects an explicit checkout cart that no longer owns the cookie session', () => {
    const state = {
      cartId: 'cart_current',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    }
    server.getCartCookieState.mockReturnValue(state)

    expect(() =>
      requireCheckoutCartCookieStateForCart(market, 'cart-other'),
    ).toThrow(CheckoutCartSessionMismatchError)
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('rejects an explicit checkout cart when no cart session exists', () => {
    server.getCartCookieState.mockReturnValue({})

    expect(() =>
      requireCheckoutCartCookieStateForCart(market, 'cart-current'),
    ).toThrow(CheckoutCartSessionMismatchError)
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('keeps the current cart session for implicit checkout cart reads', () => {
    const state = {
      cartId: 'cart_current',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    }
    server.getCartCookieState.mockReturnValue(state)

    expect(getCheckoutCartCookieStateForMarket(market)).toBe(state)
  })

  it('rejects an order-shaped cookie before checking market ownership', () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'or_completed-order',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })

    expect(() => getCheckoutCartCookieStateForMarket(market)).toThrow(
      CartResourceTypeMismatchError,
    )
    expect(server.isCartMarketKeyCompatible).not.toHaveBeenCalled()
  })

  it('keeps confirm-payment callbacks from clearing another active cart', () => {
    const state = {
      cartId: 'cart_current',
      cartMarketKey: 'market:market-current',
      cartToken: 'cart-token',
    }
    server.getCartCookieState.mockReturnValue(state)
    server.isCartMarketKeyCompatible.mockReturnValue(false)

    expect(() =>
      getCheckoutCartCookieStateForMarket(market, 'cart-old'),
    ).toThrow()
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('rejects a same-market callback for another active cart owner', () => {
    const state = {
      cartId: 'cart_current',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    }
    server.getCartCookieState.mockReturnValue(state)

    expect(() =>
      getCheckoutCartCookieStateForMarket(market, 'cart-old'),
    ).toThrow(CheckoutCartSessionMismatchError)
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('clears the owned cart for an explicit market mismatch', () => {
    const state = {
      cartId: 'cart_current',
      cartMarketKey: 'market:market-current',
      cartToken: 'cart-token',
    }
    server.getCartCookieState.mockReturnValue(state)
    server.isCartMarketKeyCompatible.mockReturnValue(false)

    expect(() =>
      getCheckoutCartCookieStateForMarket(market, 'cart_current'),
    ).toThrow()
    expect(server.clearCartCookies).toHaveBeenCalledOnce()
  })
})

describe('getCheckoutCartRequestOptions', () => {
  it('does not send a whitespace-only cart token to Spree', () => {
    expect(getCheckoutCartRequestOptions('   ')).toEqual({})
  })

  it('uses an explicitly refreshed customer token over the cookie snapshot', () => {
    server.getCustomerAccessToken.mockReturnValue('stale-customer-token')

    expect(
      getCheckoutCartRequestOptions('cart-token', 'refreshed-customer-token'),
    ).toEqual({
      spreeToken: 'cart-token',
      token: 'refreshed-customer-token',
    })
  })
})

describe('withCheckoutCustomerSession', () => {
  it('keeps guest cart operations outside the customer session boundary', async () => {
    const client = {} as Client
    const operation = vi.fn().mockResolvedValue('updated')

    await expect(
      withCheckoutCustomerSession({ client, operation }),
    ).resolves.toBe('updated')

    expect(operation).toHaveBeenCalledWith()
    expect(server.withCustomerSession).not.toHaveBeenCalled()
  })

  it('passes the refreshed customer identity to the complete cart operation', async () => {
    const client = {} as Client
    const operation = vi.fn().mockResolvedValue('updated')
    server.getCustomerRefreshToken.mockReturnValue('refresh-token')
    server.withCustomerSession.mockImplementation(
      async (
        action: (context: {
          client: Client
          token: string
        }) => Promise<unknown>,
      ) => action({ client, token: 'refreshed-customer-token' }),
    )

    await expect(
      withCheckoutCustomerSession({ client, operation }),
    ).resolves.toBe('updated')

    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client },
    )
    expect(operation).toHaveBeenCalledWith('refreshed-customer-token')
  })

  it('does not run a cart operation when customer authentication fails', async () => {
    const client = {} as Client
    const operation = vi.fn().mockResolvedValue('updated')
    server.getCustomerAccessToken.mockReturnValue('expired-customer-token')
    server.withCustomerSession.mockRejectedValue(
      new Error('Customer session required'),
    )

    await expect(
      withCheckoutCustomerSession({ client, operation }),
    ).rejects.toThrow('Customer session required')

    expect(operation).not.toHaveBeenCalled()
  })
})

describe('clearCheckoutCartCookiesIfOwnedByCart', () => {
  it('does not clear a newer active cart for an older checkout result', () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart-current',
    })

    clearCheckoutCartCookiesIfOwnedByCart('cart-old')

    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('clears the active cart when the completed checkout owns it', () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart-current',
    })

    clearCheckoutCartCookiesIfOwnedByCart('cart-current')

    expect(server.clearCartCookies).toHaveBeenCalledOnce()
  })

  it('does not re-read when the caller already observed another cookie owner', () => {
    clearCheckoutCartCookiesIfOwnedByCart('cart-current', 'cart-other')

    expect(server.getCartCookieState).not.toHaveBeenCalled()
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('rechecks the current owner before clearing an observed checkout cart', () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart-new',
    })

    clearCheckoutCartCookiesIfOwnedByCart('cart-current', 'cart-current')

    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('does not clear a same-cart session after its token changes', () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'rotated-token',
    })

    clearCheckoutCartCookiesIfOwnedByCart(
      'cart-current',
      'cart-current',
      'request-token',
    )

    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('clears a same-cart session when its token still matches', () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'request-token',
    })

    clearCheckoutCartCookiesIfOwnedByCart(
      'cart-current',
      'cart-current',
      ' request-token ',
    )

    expect(server.clearCartCookies).toHaveBeenCalledOnce()
  })
})

describe('assertCheckoutCartMatchesMarket', () => {
  it('reads and asserts the explicit cart before a checkout write', async () => {
    const getCart = vi.fn().mockResolvedValue(cart)
    const client = { carts: { get: getCart } } as unknown as Pick<
      Client,
      'carts'
    >

    await assertCheckoutCartMatchesMarket({
      cartId: cart.id,
      cartToken: 'cart-token',
      client,
      market,
    })

    expect(getCart).toHaveBeenCalledWith(cart.id, {
      spreeToken: 'cart-token',
    })
    expect(server.assertCartMarket).toHaveBeenCalledWith(cart, market)
  })

  it('returns a refreshed token from the verified cart response', async () => {
    const refreshedCart = {
      ...cart,
      token: 'refreshed-cart-token',
    }
    const getCart = vi.fn().mockResolvedValue({
      ...refreshedCart,
    })
    const client = { carts: { get: getCart } } as unknown as Pick<
      Client,
      'carts'
    >

    await expect(
      assertCheckoutCartMatchesMarket({
        cartId: cart.id,
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).resolves.toBe('refreshed-cart-token')

    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: refreshedCart.id,
        cartMarketKey: 'market:market-us',
        cartToken: refreshedCart.token,
      },
      refreshedCart.id,
      'cart-token',
    )
  })

  it('propagates a market mismatch before any mutation can run', async () => {
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMarket.mockImplementationOnce(() => {
      throw mismatch
    })
    const client = {
      carts: { get: vi.fn().mockResolvedValue(cart) },
    } as unknown as Pick<Client, 'carts'>

    await expect(
      assertCheckoutCartMatchesMarket({
        cartId: cart.id,
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toBe(mismatch)
  })

  it('projects the verified cart before persisting a rotated token', async () => {
    const projectionError = new Error('cart projection failed')
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })
    const client = {
      carts: { get: vi.fn().mockResolvedValue(cart) },
    } as unknown as Pick<Client, 'carts'>

    await expect(
      assertCheckoutCartMatchesMarket({
        cartId: cart.id,
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toBe(projectionError)

    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('rejects a verified cart when persistence loses ownership', async () => {
    const getCart = vi.fn().mockResolvedValue({
      ...cart,
      token: 'refreshed-cart-token',
    })
    const client = { carts: { get: getCart } } as unknown as Pick<
      Client,
      'carts'
    >
    server.setCartCookiesIfCurrentCartMatches.mockReturnValue(false)

    await expect(
      assertCheckoutCartMatchesMarket({
        cartId: cart.id,
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toThrow(CheckoutCartSessionMismatchError)

    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledOnce()
  })

  it('rejects a cart response whose identity differs from the request', async () => {
    const client = {
      carts: { get: vi.fn().mockResolvedValue({ id: 'cart_other' }) },
    } as unknown as Pick<Client, 'carts'>

    await expect(
      assertCheckoutCartMatchesMarket({
        cartId: 'cart_us',
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toBeInstanceOf(CartResourceIdentityMismatchError)
  })

  it('rejects a non-cart resource before checking market ownership', async () => {
    const client = {
      carts: { get: vi.fn().mockResolvedValue({ id: 'or_order' }) },
    } as unknown as Pick<Client, 'carts'>

    await expect(
      assertCheckoutCartMatchesMarket({
        cartId: 'cart_us',
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toBeInstanceOf(CartResourceTypeMismatchError)

    expect(server.assertCartMarket).not.toHaveBeenCalled()
  })
})

describe('requireCheckoutCustomerCartAssociation', () => {
  it('fails closed when the cart token is whitespace-only', async () => {
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    const associate = vi.fn()
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_us',
        cartToken: '   ',
        client,
        market,
      }),
    ).rejects.toThrow('Sign in again to use a saved payment method')

    expect(associate).not.toHaveBeenCalled()
  })

  it('persists the verified association response and returns customer request options', async () => {
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_us',
      market_id: 'market-us',
      token: 'associated-cart-token',
    })
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_us',
        cartToken: 'guest-cart-token',
        client,
        market,
      }),
    ).resolves.toEqual({
      spreeToken: 'associated-cart-token',
      token: 'customer-token',
    })

    expect(associate).toHaveBeenCalledWith('cart_us', {
      spreeToken: 'guest-cart-token',
      token: 'customer-token',
    })
    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: 'cart_us',
        cartMarketKey: 'market:market-us',
        cartToken: 'associated-cart-token',
      },
      'cart_us',
      'guest-cart-token',
    )
  })

  it('does not persist an association response when checkout projection fails', async () => {
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    const projectionError = new Error('association projection failed')
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_us',
      market_id: 'market-us',
      token: 'associated-cart-token',
    })
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_us',
        cartToken: 'guest-cart-token',
        client,
        market,
      }),
    ).rejects.toBe(projectionError)

    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('rejects an association when persistence loses ownership', async () => {
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_us',
      market_id: 'market-us',
      token: 'associated-cart-token',
    })
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>
    server.setCartCookiesIfCurrentCartMatches.mockReturnValue(false)

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_us',
        cartToken: 'guest-cart-token',
        client,
        market,
      }),
    ).rejects.toThrow(CheckoutCartSessionMismatchError)

    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledOnce()
  })

  it('uses an explicitly refreshed customer token for association', async () => {
    server.getCustomerAccessToken.mockReturnValue('stale-customer-token')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_us',
      market_id: 'market-us',
      token: 'associated-cart-token',
    })
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>

    await requireCheckoutCustomerCartAssociation({
      cartId: 'cart_us',
      cartToken: 'guest-cart-token',
      client,
      customerToken: 'refreshed-customer-token',
      market,
    })

    expect(associate).toHaveBeenCalledWith('cart_us', {
      spreeToken: 'guest-cart-token',
      token: 'refreshed-customer-token',
    })
  })

  it('preserves unauthorized association errors for the session retry boundary', async () => {
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const associate = vi.fn().mockRejectedValue(unauthorized)
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_us',
        cartToken: 'guest-cart-token',
        client,
        market,
      }),
    ).rejects.toBe(unauthorized)
  })

  it('preserves a cart resource identity mismatch instead of masking it as a saved-card session error', async () => {
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_other',
      market_id: 'market-us',
      token: 'other-cart-token',
    })
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_us',
        cartToken: 'guest-cart-token',
        client,
        market,
      }),
    ).rejects.toBeInstanceOf(CartResourceIdentityMismatchError)

    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
    expect(server.assertCartMarket).not.toHaveBeenCalled()
  })

  it('preserves a non-cart association response instead of masking it as a saved-card session error', async () => {
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'or_order',
      market_id: 'market-us',
      token: 'order-token',
    })
    const client = { carts: { associate } } as unknown as Pick<Client, 'carts'>

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_us',
        cartToken: 'guest-cart-token',
        client,
        market,
      }),
    ).rejects.toBeInstanceOf(CartResourceTypeMismatchError)

    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
    expect(server.assertCartMarket).not.toHaveBeenCalled()
  })
})

describe('persistCheckoutCartCookies', () => {
  it('reports when the current cart owner rejects persistence', () => {
    server.setCartCookiesIfCurrentCartMatches.mockReturnValue(false)

    expect(
      persistCheckoutCartCookies(
        { id: 'cart_us', token: 'rotated-cart-token' },
        market,
        {
          expectedCartId: 'cart_us',
          expectedCurrentCartToken: 'cart-token',
        },
      ),
    ).toBe(false)
  })

  it('preserves the cart handle when persisting an order resource', () => {
    persistCheckoutCartCookies({ id: 'or_123', token: 'order-token' }, market, {
      cartIdOverride: 'cart_us',
      fallbackToken: 'cart-token',
    })

    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: 'cart_us',
        cartMarketKey: 'market:market-us',
        cartToken: 'order-token',
      },
      'cart_us',
      undefined,
    )
  })

  it('does not persist a response for another cart', () => {
    expect(() =>
      persistCheckoutCartCookies(
        { id: 'cart_other', token: 'cart-token' },
        market,
        { expectedCartId: 'cart_us' },
      ),
    ).toThrow(CartResourceIdentityMismatchError)
    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not persist a non-cart response on the expected-cart path', () => {
    expect(() =>
      persistCheckoutCartCookies(
        { id: 'or_order', token: 'order-token' },
        market,
        { expectedCartId: 'cart_us' },
      ),
    ).toThrow(CartResourceTypeMismatchError)
    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not persist a response from another market', () => {
    const mismatch = new Error('cart belongs to another market')
    const response = {
      currency: 'EUR',
      id: 'cart_us',
      market_id: 'market-eu',
    } as Parameters<typeof persistCheckoutCartCookies>[0]
    server.assertCartMarket.mockImplementationOnce(() => {
      throw mismatch
    })

    expect(() =>
      persistCheckoutCartCookies(response, market, {
        expectedCartId: 'cart_us',
        fallbackToken: 'cart-token',
      }),
    ).toThrow(mismatch)
    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('uses the fallback token when a response token is only whitespace', () => {
    persistCheckoutCartCookies({ id: 'cart_us', token: '   ' }, market, {
      expectedCartId: 'cart_us',
      fallbackToken: 'cart-token',
    })

    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: 'cart_us',
        cartMarketKey: 'market:market-us',
        cartToken: 'cart-token',
      },
      'cart_us',
      undefined,
    )
  })
})
