// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedMarket } from '@/lib/core/market'
import { CartListResponseTypeMismatchError } from '../utils/cart-list-response'
import { CartOrderResourceIdentityMismatchError } from '../utils/order-resource-identity'

import { getCartForMarket } from './cart-read.server'

type MockCartCookieState = {
  cartId?: string
  cartMarketKey?: string
  cartToken?: string
}

const server = vi.hoisted(() => {
  class MockCustomerSessionRequiredError extends Error {
    constructor() {
      super('Customer session is required.')
      this.name = 'CustomerSessionRequiredError'
    }
  }

  class MockCartSessionMismatchError extends Error {
    constructor() {
      super('This cart session no longer matches the active cart.')
      this.name = 'CartSessionMismatchError'
    }
  }

  return {
    assertCartResourceIsCart: vi.fn(),
    assertCartResourceMatchesId: vi.fn(),
    isCartResourceIdentityMismatch: vi.fn(() => false),
    isCartResourceTokenMissing: vi.fn(() => false),
    isCartResourceTypeMismatch: vi.fn<(error: unknown) => boolean>(() => false),
    assertCartMarket: vi.fn(),
    clearCartCookiesIfCurrentCartMatches: vi.fn(),
    clearCartCookies: vi.fn(),
    getCartCookieState: vi.fn<() => MockCartCookieState>(() => ({
      cartId: 'cart-current',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })),
    isCartCookieStateIncomplete: vi.fn(() => false),
    getCustomerAccessToken: vi.fn<() => string | undefined>(
      () => 'customer-token',
    ),
    getCustomerRefreshToken: vi.fn<() => string | undefined>(
      () => 'refresh-token',
    ),
    getCartRequestOptions: vi.fn<
      (cartToken?: string) => {
        spreeToken?: string
        token?: string
      }
    >((cartToken?: string) =>
      cartToken
        ? { spreeToken: cartToken, token: 'customer-token' }
        : { token: 'customer-token' },
    ),
    isCartMarketKeyCompatible: vi.fn(() => true),
    isCartMarketMismatch: vi.fn(() => false),
    isRecoverableCartResponseError: vi.fn(() => false),
    isSpreeCartCompatible: vi.fn<
      (cart: { market_id?: unknown }, market: ResolvedMarket) => boolean
    >(() => true),
    mapCart: vi.fn((cart: { id: string }) => ({ id: cart.id })),
    persistCartCookies: vi.fn(),
    persistCartCookiesForNewCart: vi.fn(),
    withCustomerSession: vi.fn(),
    MockCustomerSessionRequiredError,
    MockCartSessionMismatchError,
  }
})

const client = {
  carts: {
    get: vi.fn(),
    list: vi.fn(),
  },
  orders: {
    get: vi.fn(),
  },
}

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookiesIfCurrentCartMatches:
    server.clearCartCookiesIfCurrentCartMatches,
  clearCartCookies: server.clearCartCookies,
  getCartCookieState: server.getCartCookieState,
  isCartCookieStateIncomplete: server.isCartCookieStateIncomplete,
}))

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: server.getCustomerAccessToken,
  getCustomerRefreshToken: server.getCustomerRefreshToken,
}))

vi.mock('@/lib/account/api/customer-session.server', () => ({
  CustomerSessionRequiredError: server.MockCustomerSessionRequiredError,
  withCustomerSession: server.withCustomerSession,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: () => client,
}))

vi.mock('../mappers/cart.mapper', () => ({
  mapSpreeCartToSummary: server.mapCart,
}))

vi.mock('../utils/cart-market', () => ({
  assertSpreeCartResourceMatchesMarket: server.assertCartMarket,
  isCartMarketMismatchError: server.isCartMarketMismatch,
  isCartMarketKeyCompatibleWithMarket: server.isCartMarketKeyCompatible,
  isSpreeCartResourceCompatibleWithMarket: server.isSpreeCartCompatible,
}))

vi.mock('../utils/cart-identity', () => ({
  assertCartResourceIsCart: server.assertCartResourceIsCart,
  assertCartResourceMatchesId: server.assertCartResourceMatchesId,
  isCartResourceIdentityMismatchError: server.isCartResourceIdentityMismatch,
  isCartResourceTokenMissingError: server.isCartResourceTokenMissing,
  isCartResourceTypeMismatchError: server.isCartResourceTypeMismatch,
}))

vi.mock('../utils/cart-errors', () => ({
  CartOrderFallbackNotCompletedError: class extends Error {
    constructor() {
      super('The cart order fallback is not completed.')
      this.name = 'CartOrderFallbackNotCompletedError'
    }
  },
  isCartOrderFallbackNotCompletedError: (error: unknown) =>
    error instanceof Error &&
    error.name === 'CartOrderFallbackNotCompletedError',
  isRecoverableCartResponseError: server.isRecoverableCartResponseError,
  CartSessionMismatchError: server.MockCartSessionMismatchError,
}))

vi.mock('./cart-request.server', () => ({
  getCartRequestOptions: server.getCartRequestOptions,
  persistCartCookies: server.persistCartCookies,
  persistCartCookiesForNewCart: server.persistCartCookiesForNewCart,
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

beforeEach(() => {
  server.withCustomerSession.mockImplementation(
    async (
      action: (context: { client: typeof client; token: string }) => unknown,
      options?: { client?: typeof client },
    ) => action({ client: options?.client ?? client, token: 'customer-token' }),
  )
})

afterEach(() => {
  vi.clearAllMocks()
  server.getCartCookieState.mockReturnValue({
    cartId: 'cart-current',
    cartMarketKey: 'market:market-us',
    cartToken: 'cart-token',
  })
  server.getCartRequestOptions
    .mockReset()
    .mockImplementation((cartToken?: string) =>
      cartToken
        ? { spreeToken: cartToken, token: 'customer-token' }
        : { token: 'customer-token' },
    )
  server.isCartCookieStateIncomplete.mockReturnValue(false)
  server.getCustomerAccessToken.mockReset().mockReturnValue('customer-token')
  server.getCustomerRefreshToken.mockReset().mockReturnValue('refresh-token')
  server.isCartMarketMismatch.mockReset().mockReturnValue(false)
  server.isRecoverableCartResponseError.mockReturnValue(false)
  server.isCartMarketKeyCompatible.mockReturnValue(true)
  server.isSpreeCartCompatible.mockReturnValue(true)
  server.assertCartMarket.mockReset()
  server.assertCartResourceMatchesId.mockReset()
  server.assertCartResourceIsCart.mockReset()
  server.clearCartCookiesIfCurrentCartMatches.mockReset()
  server.isCartResourceIdentityMismatch.mockReset().mockReturnValue(false)
  server.isCartResourceTokenMissing.mockReset().mockReturnValue(false)
  server.isCartResourceTypeMismatch.mockReset().mockReturnValue(false)
  server.persistCartCookies.mockReset()
  server.persistCartCookiesForNewCart.mockReset()
  server.withCustomerSession.mockReset()
  client.carts.get.mockReset()
  client.carts.list.mockReset()
  client.orders.get.mockReset()
})

describe('getCartForMarket', () => {
  it('persists a rotated token from a successful cart read', async () => {
    const cart = {
      currency: 'USD',
      id: 'cart-current',
      market_id: 'market-us',
      token: 'rotated-cart-token',
    }
    client.carts.get.mockResolvedValue(cart)

    await expect(getCartForMarket(market)).resolves.toEqual({
      id: cart.id,
    })

    expect(server.persistCartCookies).toHaveBeenCalledWith(
      market,
      cart,
      cart.id,
      'cart-token',
    )
    expect(server.mapCart).toHaveBeenCalledWith(cart)
  })

  it('fails closed when an active cart read loses cookie ownership', async () => {
    const cart = {
      currency: 'USD',
      id: 'cart-current',
      market_id: 'market-us',
      token: 'rotated-cart-token',
    }
    client.carts.get.mockResolvedValue(cart)
    server.persistCartCookies.mockReturnValue(false)

    await expect(getCartForMarket(market)).rejects.toMatchObject({
      name: 'CartSessionMismatchError',
    })
  })

  it('does not persist a cart session when mapping an active cart fails', async () => {
    const cart = {
      currency: 'USD',
      id: 'cart-current',
      market_id: 'market-us',
      token: 'rotated-cart-token',
    }
    const mappingError = new Error('Spree money amount is invalid')
    client.carts.get.mockResolvedValue(cart)
    server.mapCart.mockImplementationOnce(() => {
      throw mappingError
    })

    await expect(getCartForMarket(market)).rejects.toBe(mappingError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('fails closed when a cart response has no usable token', async () => {
    const tokenMismatch = new Error('cart token is missing')
    const cart = {
      currency: 'USD',
      id: 'cart-current',
      market_id: 'market-us',
    }
    client.carts.get.mockResolvedValue(cart)
    server.persistCartCookies.mockImplementationOnce(() => {
      server.isCartResourceTokenMissing.mockReturnValueOnce(true)
      throw tokenMismatch
    })

    await expect(getCartForMarket(market)).rejects.toBe(tokenMismatch)
    expect(client.carts.list).not.toHaveBeenCalled()
    expect(client.orders.get).not.toHaveBeenCalled()
  })

  it('clears an incomplete implicit cart session before reading Spree', async () => {
    server.getCartCookieState.mockReturnValue({
      cartId: undefined,
      cartMarketKey: 'market:market-us',
      cartToken: 'orphan-token',
    })
    server.isCartCookieStateIncomplete.mockReturnValue(true)

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(server.clearCartCookies).toHaveBeenCalledOnce()
    expect(client.carts.get).not.toHaveBeenCalled()
    expect(client.carts.list).not.toHaveBeenCalled()
  })

  it('clears an id-only cart session before reading Spree', async () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart-current',
      cartMarketKey: 'market:market-us',
    })
    server.isCartCookieStateIncomplete.mockReturnValue(true)

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(server.clearCartCookies).toHaveBeenCalledOnce()
    expect(client.carts.get).not.toHaveBeenCalled()
    expect(client.carts.list).not.toHaveBeenCalled()
  })

  it('restores an authenticated cart when no cart cookies exist', async () => {
    const authenticatedCart = {
      currency: 'USD',
      id: 'cart-authenticated',
      market_id: 'market-us',
      token: 'authenticated-cart-token',
    }
    server.getCartCookieState.mockReturnValue({})
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })

    await expect(getCartForMarket(market)).resolves.toEqual({
      id: authenticatedCart.id,
    })

    expect(client.carts.list).toHaveBeenCalledWith({ token: 'customer-token' })
    expect(server.assertCartMarket).toHaveBeenCalledWith(
      authenticatedCart,
      market,
    )
    expect(server.persistCartCookiesForNewCart).toHaveBeenCalledWith(
      market,
      authenticatedCart,
      authenticatedCart.id,
    )
    expect(server.mapCart).toHaveBeenCalledWith(authenticatedCart)
    expect(client.carts.get).not.toHaveBeenCalled()
    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client },
    )
  })

  it('fails closed when authenticated cart restoration loses cookie ownership', async () => {
    const authenticatedCart = {
      currency: 'USD',
      id: 'cart-authenticated',
      market_id: 'market-us',
      token: 'authenticated-cart-token',
    }
    server.getCartCookieState.mockReturnValue({})
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })
    server.persistCartCookiesForNewCart.mockReturnValue(false)

    await expect(getCartForMarket(market)).rejects.toMatchObject({
      name: 'CartSessionMismatchError',
    })

    expect(server.mapCart).toHaveBeenCalledWith(authenticatedCart)
    expect(client.orders.get).not.toHaveBeenCalled()
  })

  it('does not persist a restored cart session when mapping fails', async () => {
    const authenticatedCart = {
      currency: 'USD',
      id: 'cart-authenticated',
      market_id: 'market-us',
      token: 'authenticated-cart-token',
    }
    const mappingError = new Error('Spree money amount is invalid')
    server.getCartCookieState.mockReturnValue({})
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })
    server.mapCart.mockImplementationOnce(() => {
      throw mappingError
    })

    await expect(getCartForMarket(market)).rejects.toBe(mappingError)

    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
  })

  it('fails closed when an implicit authenticated cart list envelope is malformed', async () => {
    server.getCartCookieState.mockReturnValue({})
    client.carts.list.mockResolvedValue({ data: null })

    await expect(getCartForMarket(market)).rejects.toBeInstanceOf(
      CartListResponseTypeMismatchError,
    )

    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
    expect(server.mapCart).not.toHaveBeenCalled()
  })

  it('restores an authenticated cart through a refresh-only customer session', async () => {
    const authenticatedCart = {
      currency: 'USD',
      id: 'cart-authenticated',
      market_id: 'market-us',
      token: 'authenticated-cart-token',
    }
    server.getCartCookieState.mockReturnValue({})
    server.getCustomerAccessToken.mockReturnValue(undefined)
    server.withCustomerSession.mockImplementationOnce(
      async (
        action: (context: { client: typeof client; token: string }) => unknown,
        options?: { client?: typeof client },
      ) =>
        action({
          client: options?.client ?? client,
          token: 'refreshed-customer-token',
        }),
    )
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })

    await expect(getCartForMarket(market)).resolves.toEqual({
      id: authenticatedCart.id,
    })

    expect(client.carts.list).toHaveBeenCalledWith({
      token: 'refreshed-customer-token',
    })
    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client },
    )
  })

  it('returns null when the customer session cannot be recovered', async () => {
    server.getCartCookieState.mockReturnValue({})
    server.getCustomerAccessToken.mockReturnValue(undefined)
    server.withCustomerSession.mockRejectedValueOnce(
      new server.MockCustomerSessionRequiredError(),
    )

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(client.carts.list).not.toHaveBeenCalled()
    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
  })

  it('does not list carts without a customer token', async () => {
    server.getCartCookieState.mockReturnValue({})
    server.getCustomerAccessToken.mockReturnValue(undefined)
    server.getCustomerRefreshToken.mockReturnValue(undefined)

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(client.carts.list).not.toHaveBeenCalled()
    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
    expect(server.withCustomerSession).not.toHaveBeenCalled()
  })

  it('ignores authenticated carts from another market during implicit restore', async () => {
    const authenticatedCart = {
      currency: 'EUR',
      id: 'cart-eu',
      market_id: 'market-eu',
      token: 'eu-cart-token',
    }
    server.getCartCookieState.mockReturnValue({})
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })
    server.isSpreeCartCompatible.mockReturnValue(false)

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
    expect(server.mapCart).not.toHaveBeenCalled()
  })

  it('restores the first authenticated cart that belongs to the active market', async () => {
    const euCart = {
      currency: 'EUR',
      id: 'cart-eu',
      market_id: 'market-eu',
      token: 'eu-cart-token',
    }
    const usCart = {
      currency: 'USD',
      id: 'cart-us',
      market_id: 'market-us',
      token: 'us-cart-token',
    }
    server.getCartCookieState.mockReturnValue({})
    client.carts.list.mockResolvedValue({ data: [euCart, usCart] })
    server.isSpreeCartCompatible.mockImplementation(
      (cart: { market_id?: unknown }) => cart.market_id === market.marketId,
    )

    await expect(getCartForMarket(market)).resolves.toEqual({
      id: usCart.id,
    })

    expect(server.assertCartMarket).toHaveBeenCalledWith(usCart, market)
    expect(server.persistCartCookiesForNewCart).toHaveBeenCalledWith(
      market,
      usCart,
      usCart.id,
    )
    expect(server.mapCart).toHaveBeenCalledWith(usCart)
  })

  it('fails closed when an implicit authenticated list contains a non-cart resource', async () => {
    const resourceMismatch = new Error('response is not a cart resource')
    const invalidResource = { id: 'or_order' }
    server.getCartCookieState.mockReturnValue({})
    client.carts.list.mockResolvedValue({ data: [invalidResource] })
    server.assertCartResourceIsCart.mockImplementation((resource) => {
      if (resource === invalidResource) {
        throw resourceMismatch
      }
    })
    server.isCartResourceTypeMismatch.mockImplementation(
      (error) => error === resourceMismatch,
    )

    await expect(getCartForMarket(market)).rejects.toBe(resourceMismatch)

    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
    expect(server.mapCart).not.toHaveBeenCalled()
  })

  it('does not fall back after a cart response identity mismatch', async () => {
    const identityMismatch = new Error('cart response identity mismatch')
    server.assertCartResourceMatchesId.mockImplementationOnce(() => {
      throw identityMismatch
    })
    server.isCartResourceIdentityMismatch.mockReturnValue(true)
    client.carts.get.mockResolvedValue({ id: 'cart-other' })

    await expect(getCartForMarket(market)).rejects.toBe(identityMismatch)

    expect(client.carts.list).not.toHaveBeenCalled()
    expect(client.orders.get).not.toHaveBeenCalled()
  })

  it('does not clear the active cart for an explicit cart market mismatch', async () => {
    const marketMismatch = new Error('cart belongs to another market')
    server.isSpreeCartCompatible.mockReturnValue(false)
    server.assertCartMarket.mockImplementation(() => {
      throw marketMismatch
    })
    client.carts.get.mockResolvedValue({
      currency: 'EUR',
      id: 'cart-old',
      market_id: 'market-eu',
    })
    client.orders.get.mockResolvedValue({ id: 'or_eu' })

    await expect(getCartForMarket(market, 'cart-old')).rejects.toBe(
      marketMismatch,
    )

    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('does not clear the active cart for an implicit market-key mismatch', async () => {
    server.isCartMarketKeyCompatible.mockReturnValue(false)

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(client.carts.get).not.toHaveBeenCalled()
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('does not replace the active cart after a non-recoverable read failure', async () => {
    const serverError = Object.assign(new Error('upstream unavailable'), {
      status: 500,
    })
    client.carts.get.mockRejectedValue(serverError)
    client.orders.get.mockRejectedValue(serverError)

    await expect(getCartForMarket(market)).rejects.toBe(serverError)

    expect(client.carts.list).not.toHaveBeenCalled()
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('uses the authenticated cart fallback for a recoverable cart-cookie error', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const authenticatedCart = {
      currency: 'USD',
      id: 'cart-authenticated',
      market_id: 'market-us',
      token: 'authenticated-cart-token',
    }
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market)).resolves.toEqual({
      id: authenticatedCart.id,
    })

    expect(client.carts.list).toHaveBeenCalledWith({ token: 'customer-token' })
    expect(server.persistCartCookiesForNewCart).toHaveBeenCalledWith(
      market,
      authenticatedCart,
      authenticatedCart.id,
      'cart-current',
      'cart-token',
    )
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('does not fall through to order recovery when authenticated cart projection fails', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const authenticatedCart = {
      currency: 'USD',
      id: 'cart-authenticated',
      market_id: 'market-us',
      token: 'authenticated-cart-token',
    }
    const projectionError = new Error('Spree money amount is invalid')
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })
    server.isRecoverableCartResponseError.mockReturnValue(true)
    server.mapCart.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(getCartForMarket(market)).rejects.toBe(projectionError)

    expect(client.orders.get).not.toHaveBeenCalled()
    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
  })

  it('does not fall through to order recovery after a malformed authenticated cart list envelope', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: null })
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market)).rejects.toBeInstanceOf(
      CartListResponseTypeMismatchError,
    )

    expect(client.orders.get).not.toHaveBeenCalled()
    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
  })

  it('fails closed when the authenticated cart list contains a non-cart resource', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const resourceMismatch = new Error('response is not a cart resource')
    const invalidResource = { id: 'or_order' }
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [invalidResource] })
    server.isRecoverableCartResponseError.mockReturnValue(true)
    server.assertCartResourceIsCart.mockImplementation((resource) => {
      if (resource === invalidResource) {
        throw resourceMismatch
      }
    })
    server.isCartResourceTypeMismatch.mockImplementation(
      (error) => error === resourceMismatch,
    )

    await expect(getCartForMarket(market)).rejects.toBe(resourceMismatch)

    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
    expect(server.mapCart).not.toHaveBeenCalled()
    expect(client.orders.get).not.toHaveBeenCalled()
  })

  it('selects the explicit cart from the authenticated list instead of the first cart', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const firstCart = {
      currency: 'USD',
      id: 'cart-other',
      market_id: 'market-us',
      token: 'other-cart-token',
    }
    const targetCart = {
      currency: 'USD',
      id: 'cart-current',
      market_id: 'market-us',
      token: 'target-cart-token',
    }
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [firstCart, targetCart] })
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market, targetCart.id)).resolves.toEqual({
      id: targetCart.id,
    })

    expect(server.assertCartMarket).toHaveBeenCalledWith(targetCart, market)
    expect(server.persistCartCookies).toHaveBeenCalledWith(
      market,
      targetCart,
      targetCart.id,
      'cart-token',
    )
    expect(server.mapCart).toHaveBeenCalledWith(targetCart)
  })

  it('does not project a completed order into the active cart state', async () => {
    const recoverableError = Object.assign(new Error('Cart completed'), {
      status: 404,
    })
    const completedOrder = {
      completed_at: '2026-08-25T10:00:00Z',
      id: 'or_123',
    }
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [] })
    client.orders.get.mockResolvedValue(completedOrder)
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(server.assertCartMarket).toHaveBeenCalledWith(completedOrder, market)
    expect(server.clearCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      'cart-current',
      'cart-token',
    )
    expect(server.mapCart).not.toHaveBeenCalled()
  })

  it('retries completed-order fallback with only the cart token for a guest cart', async () => {
    const recoverableError = Object.assign(new Error('Cart completed'), {
      status: 404,
    })
    const completedOrder = {
      completed_at: '2026-08-25T10:00:00Z',
      id: 'or_123',
    }
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [] })
    client.orders.get
      .mockRejectedValueOnce(new Error('customer scope does not own cart'))
      .mockResolvedValueOnce(completedOrder)
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market)).resolves.toBeNull()

    expect(client.orders.get).toHaveBeenNthCalledWith(
      1,
      'cart-current',
      undefined,
      { spreeToken: 'cart-token', token: 'customer-token' },
    )
    expect(client.orders.get).toHaveBeenNthCalledWith(
      2,
      'cart-current',
      undefined,
      { spreeToken: 'cart-token' },
    )
    expect(server.clearCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      'cart-current',
      'cart-token',
    )
  })

  it('does not clear the active cart for an incomplete order fallback', async () => {
    const recoverableError = Object.assign(new Error('Cart unavailable'), {
      status: 404,
    })
    const incompleteOrder = {
      completed_at: null,
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [] })
    client.orders.get.mockResolvedValue(incompleteOrder)
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market)).rejects.toThrow(
      'The cart order fallback is not completed.',
    )

    expect(server.clearCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
    expect(server.mapCart).not.toHaveBeenCalled()
  })

  it('propagates an order fallback market mismatch for an explicit cart', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const marketMismatch = new Error('order belongs to another market')
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [] })
    client.orders.get.mockResolvedValue({
      currency: 'EUR',
      id: 'or_eu',
      market_id: 'market-eu',
    })
    server.assertCartMarket.mockImplementation(() => {
      throw marketMismatch
    })
    server.isCartMarketMismatch.mockReturnValue(true)
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market, 'cart-current')).rejects.toBe(
      marketMismatch,
    )

    expect(server.clearCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('rejects a cart-shaped order fallback before cleanup', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [] })
    client.orders.get.mockResolvedValue({ id: 'cart-other' })
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(
      getCartForMarket(market, 'cart-current'),
    ).rejects.toBeInstanceOf(CartOrderResourceIdentityMismatchError)

    expect(server.assertCartMarket).not.toHaveBeenCalled()
    expect(server.clearCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('propagates an authenticated fallback market mismatch', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    const marketMismatch = new Error('fallback cart belongs to another market')
    const authenticatedCart = {
      currency: 'EUR',
      id: 'cart-current',
      market_id: 'market-eu',
      token: 'eu-cart-token',
    }
    client.carts.get.mockRejectedValue(recoverableError)
    client.carts.list.mockResolvedValue({ data: [authenticatedCart] })
    server.assertCartMarket.mockImplementation(() => {
      throw marketMismatch
    })
    server.isCartMarketMismatch.mockReturnValue(true)
    server.isRecoverableCartResponseError.mockReturnValue(true)

    await expect(getCartForMarket(market, authenticatedCart.id)).rejects.toBe(
      marketMismatch,
    )

    expect(client.orders.get).not.toHaveBeenCalled()
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })
})
