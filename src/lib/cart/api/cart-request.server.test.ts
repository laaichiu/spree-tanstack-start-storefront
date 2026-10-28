// @vitest-environment node

import type { Client } from '@spree/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedMarket } from '@/lib/core/market'
import { CartSessionMismatchError } from '../utils/cart-errors'

import {
  assertCartMutationCartMatchesMarket,
  createCartForCurrentSession,
  getCartRequestOptions,
  getRequiredCartCookieStateForMarket,
  persistCartCookies,
  persistCartCookiesForNewCart,
} from './cart-request.server'

const server = vi.hoisted(() => ({
  CustomerSessionRequiredError: class MockCustomerSessionRequiredError extends Error {
    constructor() {
      super('Customer session is required.')
      this.name = 'CustomerSessionRequiredError'
    }
  },
  assertCartMarket: vi.fn(),
  assertCartResourceHasToken: vi.fn(),
  assertCartResourceIsCart: vi.fn(),
  assertCartResourceMatchesId: vi.fn(),
  clearCartCookies: vi.fn(),
  getCartCookieState: vi.fn(() => ({
    cartId: 'cart-us',
    cartMarketKey: 'market:market-us',
    cartToken: 'cart-token',
  })),
  getCustomerAccessToken: vi.fn(() => 'customer-token'),
  isCartCookieStateIncomplete: vi.fn(() => false),
  isCartMarketKeyCompatible: vi.fn(() => true),
  mapCart: vi.fn(),
  setCartCookies: vi.fn(),
  setCartCookiesIfCurrentCartMatches: vi.fn(),
  withCustomerSession: vi.fn(),
}))

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: server.getCustomerAccessToken,
}))

vi.mock('@/lib/account/api/customer-session.server', () => ({
  CustomerSessionRequiredError: server.CustomerSessionRequiredError,
  withCustomerSession: server.withCustomerSession,
}))

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: server.clearCartCookies,
  getCartCookieState: server.getCartCookieState,
  isCartCookieStateIncomplete: server.isCartCookieStateIncomplete,
  setCartCookiesIfCurrentCart: server.setCartCookies,
  setCartCookiesIfCurrentCartMatches: server.setCartCookiesIfCurrentCartMatches,
}))

vi.mock('../utils/cart-market', () => ({
  CartMarketMismatchError: class CartMarketMismatchError extends Error {},
  assertSpreeCartResourceMatchesMarket: server.assertCartMarket,
  getCartMarketKey: vi.fn(() => 'market:market-us'),
  isCartMarketKeyCompatibleWithMarket: server.isCartMarketKeyCompatible,
}))

vi.mock('../utils/cart-identity', () => ({
  assertCartResourceHasToken: server.assertCartResourceHasToken,
  assertCartResourceIsCart: server.assertCartResourceIsCart,
  assertCartResourceMatchesId: server.assertCartResourceMatchesId,
}))

vi.mock('../mappers/cart.mapper', () => ({
  mapSpreeCartToSummary: server.mapCart,
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
} satisfies ResolvedMarket

afterEach(() => {
  vi.clearAllMocks()
  server.getCartCookieState.mockReturnValue({
    cartId: 'cart-us',
    cartMarketKey: 'market:market-us',
    cartToken: 'cart-token',
  })
  server.isCartCookieStateIncomplete.mockReturnValue(false)
  server.isCartMarketKeyCompatible.mockReturnValue(true)
  server.assertCartResourceHasToken.mockReset()
  server.mapCart.mockReset()
  server.setCartCookiesIfCurrentCartMatches.mockReset()
  server.withCustomerSession
    .mockReset()
    .mockRejectedValue(new server.CustomerSessionRequiredError())
})

server.withCustomerSession.mockRejectedValue(
  new server.CustomerSessionRequiredError(),
)

describe('getRequiredCartCookieStateForMarket', () => {
  it('rejects a non-cart cookie resource before checking market ownership', () => {
    const resourceMismatch = new Error('response is not a cart resource')
    server.getCartCookieState.mockReturnValue({
      cartId: 'or_order',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })
    server.assertCartResourceIsCart.mockImplementationOnce(({ id }) => {
      if (id === 'or_order') {
        throw resourceMismatch
      }
    })

    expect(() => getRequiredCartCookieStateForMarket(market)).toThrow(
      resourceMismatch,
    )
    expect(server.isCartMarketKeyCompatible).not.toHaveBeenCalled()
  })

  it('preserves the active cart when a stale market request is rejected', () => {
    server.isCartMarketKeyCompatible.mockReturnValue(false)

    expect(() => getRequiredCartCookieStateForMarket(market)).toThrow()
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })
})

describe('getCartRequestOptions', () => {
  it('omits a whitespace-only cart token', () => {
    expect(getCartRequestOptions('   ')).toEqual({
      token: 'customer-token',
    })
  })

  it('trims the cart token before building Store API options', () => {
    expect(getCartRequestOptions(' cart-token ')).toEqual({
      spreeToken: 'cart-token',
      token: 'customer-token',
    })
  })
})

describe('createCartForCurrentSession', () => {
  it('asserts the created cart market before it can be used for an item write', async () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-new',
      market_id: 'market-us',
      token: 'new-cart-token',
    }
    const create = vi.fn().mockResolvedValue(cart)
    const client = {
      customer: { get: vi.fn() },
      carts: { create },
    } as unknown as Client

    await expect(createCartForCurrentSession(client, market)).resolves.toEqual(
      cart,
    )
    expect(create).toHaveBeenCalledWith(undefined, {})
    expect(server.assertCartMarket).toHaveBeenCalledWith(cart, market)
  })

  it('validates and creates through a refreshed customer session', async () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-customer',
      market_id: 'market-us',
      token: 'customer-cart-token',
    }
    const create = vi.fn().mockResolvedValue(cart)
    const customerGet = vi.fn().mockResolvedValue({ id: 'cust_current' })
    const customerClient = {
      customer: { get: customerGet },
      carts: { create },
    } as unknown as Client
    server.withCustomerSession.mockImplementationOnce(
      async (
        action: (context: { client: Client; token: string }) => unknown,
        options: { client: Client },
      ) => action({ client: options.client, token: 'refreshed-access-token' }),
    )

    await expect(
      createCartForCurrentSession(customerClient, market),
    ).resolves.toEqual(cart)

    expect(customerGet).toHaveBeenCalledWith({
      token: 'refreshed-access-token',
    })
    expect(create).toHaveBeenCalledWith(undefined, {
      token: 'refreshed-access-token',
    })
  })

  it('fails closed before creating a cart when the customer probe is not a customer resource', async () => {
    const customerGet = vi.fn().mockResolvedValue({ id: 'order_123' })
    const create = vi.fn()
    const customerClient = {
      customer: { get: customerGet },
      carts: { create },
    } as unknown as Client
    server.withCustomerSession.mockImplementationOnce(
      async (
        action: (context: { client: Client; token: string }) => unknown,
        options: { client: Client },
      ) => action({ client: options.client, token: 'customer-access-token' }),
    )

    await expect(
      createCartForCurrentSession(customerClient, market),
    ).rejects.toThrow('not a customer resource')

    expect(create).not.toHaveBeenCalled()
  })

  it('rejects a created cart from another market before item mutation', async () => {
    const cart = {
      currency: 'EUR' as const,
      id: 'cart-new',
      market_id: 'market-eu',
      token: 'new-cart-token',
    }
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMarket.mockImplementationOnce(() => {
      throw mismatch
    })
    const client = {
      customer: { get: vi.fn() },
      carts: { create: vi.fn().mockResolvedValue(cart) },
    } as unknown as Client

    await expect(createCartForCurrentSession(client, market)).rejects.toBe(
      mismatch,
    )
  })

  it('rejects a created response that is not a cart resource', async () => {
    const resourceMismatch = new Error('response is not a cart resource')
    server.assertCartResourceIsCart.mockImplementationOnce(() => {
      throw resourceMismatch
    })
    const client = {
      customer: { get: vi.fn() },
      carts: {
        create: vi.fn().mockResolvedValue({
          currency: 'USD',
          id: 'or-order',
          market_id: 'market-us',
          token: 'unexpected-token',
        }),
      },
    } as unknown as Client

    await expect(createCartForCurrentSession(client, market)).rejects.toBe(
      resourceMismatch,
    )

    expect(server.assertCartMarket).not.toHaveBeenCalled()
  })

  it('rejects a created response without a usable token before item mutation', async () => {
    const tokenMismatch = new Error('cart token is missing')
    server.assertCartResourceHasToken.mockImplementationOnce(() => {
      throw tokenMismatch
    })
    const create = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart-new',
      market_id: 'market-us',
    })
    const client = {
      customer: { get: vi.fn() },
      carts: { create },
    } as unknown as Client

    await expect(createCartForCurrentSession(client, market)).rejects.toBe(
      tokenMismatch,
    )

    expect(server.assertCartMarket).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cart-new' }),
      market,
    )
  })

  it('does not return a created cart when its projection fails', async () => {
    const projectionError = new Error('cart projection failed')
    server.mapCart.mockImplementationOnce(() => {
      throw projectionError
    })
    const cart = {
      currency: 'USD' as const,
      id: 'cart-new',
      market_id: 'market-us',
      token: 'new-cart-token',
    }
    const client = {
      customer: { get: vi.fn() },
      carts: { create: vi.fn().mockResolvedValue(cart) },
    } as unknown as Client

    await expect(createCartForCurrentSession(client, market)).rejects.toBe(
      projectionError,
    )
  })
})

describe('assertCartMutationCartMatchesMarket', () => {
  it('reads the cookie cart from Spree before an item mutation', async () => {
    const cart = { id: 'cart-us', market_id: 'market-us' }
    const getCart = vi.fn().mockResolvedValue(cart)
    const client = { carts: { get: getCart } } as unknown as Pick<
      Client,
      'carts'
    >

    await assertCartMutationCartMatchesMarket({
      cartId: cart.id,
      cartToken: 'cart-token',
      client,
      market,
    })

    expect(getCart).toHaveBeenCalledWith(cart.id, {
      spreeToken: 'cart-token',
      token: 'customer-token',
    })
    expect(server.assertCartResourceMatchesId).toHaveBeenCalledWith(
      cart,
      cart.id,
    )
    expect(server.assertCartMarket).toHaveBeenCalledWith(cart, market)
  })

  it('returns a refreshed token from the verified cart response', async () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-us',
      market_id: 'market-us',
      token: 'refreshed-cart-token',
    }
    const getCart = vi.fn().mockResolvedValue({
      ...cart,
    })
    const client = { carts: { get: getCart } } as unknown as Pick<
      Client,
      'carts'
    >

    await expect(
      assertCartMutationCartMatchesMarket({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).resolves.toBe('refreshed-cart-token')

    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: cart.id,
        cartMarketKey: 'market:market-us',
        cartToken: cart.token,
      },
      cart.id,
      'cart-token',
    )
  })

  it('fails closed when the preflight cart loses cookie ownership', async () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-us',
      market_id: 'market-us',
      token: 'refreshed-cart-token',
    }
    const client = {
      carts: { get: vi.fn().mockResolvedValue(cart) },
    } as unknown as Pick<Client, 'carts'>
    server.setCartCookiesIfCurrentCartMatches.mockReturnValue(false)

    await expect(
      assertCartMutationCartMatchesMarket({
        cartId: cart.id,
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toBeInstanceOf(CartSessionMismatchError)
  })

  it('projects the verified cart before persisting a rotated token', async () => {
    const projectionError = new Error('cart projection failed')
    server.mapCart.mockImplementationOnce(() => {
      throw projectionError
    })
    const cart = {
      currency: 'USD' as const,
      id: 'cart-us',
      market_id: 'market-us',
      token: 'refreshed-cart-token',
    }
    const client = {
      carts: { get: vi.fn().mockResolvedValue(cart) },
    } as unknown as Pick<Client, 'carts'>

    await expect(
      assertCartMutationCartMatchesMarket({
        cartId: cart.id,
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toBe(projectionError)

    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('propagates a market mismatch before the item mutation can run', async () => {
    const cart = { id: 'cart-us', market_id: 'market-other' }
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMarket.mockImplementationOnce(() => {
      throw mismatch
    })
    const client = {
      carts: { get: vi.fn().mockResolvedValue(cart) },
    } as unknown as Pick<Client, 'carts'>

    await expect(
      assertCartMutationCartMatchesMarket({
        cartId: cart.id,
        cartToken: 'cart-token',
        client,
        market,
      }),
    ).rejects.toBe(mismatch)
  })

  it('does not persist a cart response for another cart', () => {
    const mismatch = new Error('cart response identity mismatch')
    server.assertCartResourceMatchesId.mockImplementationOnce(() => {
      throw mismatch
    })

    expect(() =>
      persistCartCookies(
        market,
        {
          currency: 'USD',
          id: 'cart-other',
          market_id: 'market-us',
          token: 'cart-token',
        },
        'cart-us',
      ),
    ).toThrow(mismatch)
    expect(server.setCartCookies).not.toHaveBeenCalled()
  })

  it('persists the response only for the requested cart identity', () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-us',
      market_id: 'market-us',
      token: 'cart-token',
    }

    persistCartCookies(market, cart, 'cart-us')

    expect(server.assertCartMarket).toHaveBeenCalledWith(cart, market)
    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: 'cart-us',
        cartMarketKey: 'market:market-us',
        cartToken: 'cart-token',
      },
      'cart-us',
      undefined,
    )
  })

  it('returns false when the requested cart no longer owns the cookie', () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-us',
      market_id: 'market-us',
      token: 'cart-token',
    }
    server.setCartCookiesIfCurrentCartMatches.mockReturnValue(false)

    expect(persistCartCookies(market, cart, cart.id, 'cart-token')).toBe(false)
  })

  it('keeps the initialization fallback when no owner snapshot is provided', () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-us',
      market_id: 'market-us',
      token: 'cart-token',
    }

    persistCartCookies(market, cart)

    expect(server.setCartCookies).toHaveBeenCalledWith(
      {
        cartId: 'cart-us',
        cartMarketKey: 'market:market-us',
        cartToken: 'cart-token',
      },
      'cart-us',
    )
    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not persist a cart response for another market', () => {
    const cart = {
      currency: 'EUR' as const,
      id: 'cart-us',
      market_id: 'market-eu',
      token: 'cart-token',
    }
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMarket.mockImplementationOnce(() => {
      throw mismatch
    })

    expect(() => persistCartCookies(market, cart, cart.id)).toThrow(mismatch)
    expect(server.setCartCookies).not.toHaveBeenCalled()
  })

  it('does not persist a non-cart response', () => {
    const resourceMismatch = new Error('response is not a cart resource')
    server.assertCartResourceIsCart.mockImplementationOnce(() => {
      throw resourceMismatch
    })

    expect(() =>
      persistCartCookies(
        market,
        {
          currency: 'USD',
          id: 'or-order',
          market_id: 'market-us',
          token: 'order-token',
        },
        'cart-us',
      ),
    ).toThrow(resourceMismatch)

    expect(server.assertCartMarket).not.toHaveBeenCalled()
    expect(server.setCartCookies).not.toHaveBeenCalled()
  })

  it('does not persist a cart response without a usable token', () => {
    const tokenMismatch = new Error('cart token is missing')
    server.assertCartResourceHasToken.mockImplementationOnce(() => {
      throw tokenMismatch
    })

    expect(() =>
      persistCartCookies(
        market,
        {
          currency: 'USD',
          id: 'cart-us',
          market_id: 'market-us',
          token: '',
        },
        'cart-us',
      ),
    ).toThrow(tokenMismatch)

    expect(server.assertCartMarket).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cart-us' }),
      market,
    )
    expect(server.setCartCookies).not.toHaveBeenCalled()
  })
})

describe('persistCartCookiesForNewCart', () => {
  it('replaces the previous cart only when it is still the current owner', () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-new',
      market_id: 'market-us',
      token: 'new-cart-token',
    }

    persistCartCookiesForNewCart(market, cart, 'cart-new', 'cart-old')

    expect(server.assertCartResourceMatchesId).toHaveBeenCalledWith(
      cart,
      'cart-new',
    )
    expect(server.assertCartMarket).toHaveBeenCalledWith(cart, market)
    expect(server.setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: 'cart-new',
        cartMarketKey: 'market:market-us',
        cartToken: 'new-cart-token',
      },
      'cart-old',
    )
  })

  it('returns false when a new-cart handover loses cookie ownership', () => {
    const cart = {
      currency: 'USD' as const,
      id: 'cart-new',
      market_id: 'market-us',
      token: 'new-cart-token',
    }
    server.setCartCookiesIfCurrentCartMatches.mockReturnValue(false)

    expect(
      persistCartCookiesForNewCart(market, cart, cart.id, 'cart-old'),
    ).toBe(false)
  })

  it('does not persist a mixed-owner new-cart response', () => {
    const mismatch = new Error('cart response identity mismatch')
    server.assertCartResourceMatchesId.mockImplementationOnce(() => {
      throw mismatch
    })

    expect(() =>
      persistCartCookiesForNewCart(
        market,
        {
          currency: 'USD',
          id: 'cart-other',
          market_id: 'market-us',
          token: 'cart-token',
        },
        'cart-new',
        'cart-old',
      ),
    ).toThrow(mismatch)
    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not hand over the cookie to a new cart from another market', () => {
    const cart = {
      currency: 'EUR' as const,
      id: 'cart-new',
      market_id: 'market-eu',
      token: 'new-cart-token',
    }
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMarket.mockImplementationOnce(() => {
      throw mismatch
    })

    expect(() =>
      persistCartCookiesForNewCart(market, cart, cart.id, 'cart-old'),
    ).toThrow(mismatch)
    expect(server.setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })
})
