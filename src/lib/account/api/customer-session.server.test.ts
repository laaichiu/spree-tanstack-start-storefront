// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCustomerAuthCookies,
  clearCustomerAuthCookiesIfCurrentRefreshToken,
  getCustomerAccessToken,
  getCustomerRefreshToken,
  setCustomerAuthCookies,
} from '@/lib/cookies/auth-cookie.server'
import { getServerSpreeClient } from '@/lib/spree/client.server'

import {
  CustomerSessionRequiredError,
  logoutCustomerOnServer,
  persistCustomerAuthSession,
  withCustomerSession,
} from './customer-session.server'
import { CustomerAuthResponseTypeMismatchError } from '../utils/customer-auth-response'

vi.mock('@tanstack/react-start/server-only', () => ({}))

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  clearCustomerAuthCookies: vi.fn(),
  clearCustomerAuthCookiesIfCurrentRefreshToken: vi.fn(),
  getCustomerAccessToken: vi.fn(),
  getCustomerRefreshToken: vi.fn(),
  setCustomerAuthCookies: vi.fn(),
}))

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: vi.fn(),
  getCartCookieState: vi.fn(() => ({})),
  normalizeCartToken: (value: unknown) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  setCartCookiesIfCurrentCartMatches: vi.fn(),
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClient: vi.fn(),
}))

vi.mock('@/lib/cart/mappers/cart.mapper', () => ({
  mapSpreeCartToSummary: vi.fn(),
}))

function spreeError(status: number, code?: string) {
  return Object.assign(new Error(`Spree request failed with ${status}.`), {
    ...(code ? { code } : {}),
    status,
  })
}

function setSpreeClient() {
  const refresh = vi.fn()

  vi.mocked(getServerSpreeClient).mockReturnValue({
    auth: { refresh },
  } as never)

  return { refresh }
}

describe('customer session lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCustomerAccessToken).mockReturnValue('access-token')
    vi.mocked(getCustomerRefreshToken).mockReturnValue('refresh-token')
    vi.mocked(setCustomerAuthCookies).mockReturnValue(true)
    vi.mocked(clearCustomerAuthCookiesIfCurrentRefreshToken).mockReturnValue(
      true,
    )
  })

  it('refreshes when only a refresh token remains', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'ada@example.com',
        first_name: 'Ada',
        id: 'cust_current',
        last_name: 'Lovelace',
      },
    })
    const action = vi.fn(async ({ token }: { token: string }) => token)

    await expect(withCustomerSession(action)).resolves.toBe('next-access-token')
    expect(refresh).toHaveBeenCalledWith({ refresh_token: 'refresh-token' })
    expect(setCustomerAuthCookies).toHaveBeenCalledWith({
      expectedCurrentRefreshToken: 'refresh-token',
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })
    expect(action).toHaveBeenCalledOnce()
  })

  it('uses a supplied market-specific client for refresh and action', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const refresh = vi.fn().mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'ada@example.com',
        first_name: 'Ada',
        id: 'cust_current',
        last_name: 'Lovelace',
      },
    })
    const suppliedClient = { auth: { refresh } }
    const action = vi.fn(async ({ client, token }) => ({ client, token }))

    await expect(
      withCustomerSession(action, { client: suppliedClient as never }),
    ).resolves.toEqual({
      client: suppliedClient,
      token: 'next-access-token',
    })

    expect(getServerSpreeClient).not.toHaveBeenCalled()
    expect(refresh).toHaveBeenCalledWith({ refresh_token: 'refresh-token' })
  })

  it('refreshes and retries once after an unauthorized response', async () => {
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'ada@example.com',
        first_name: 'Ada',
        id: 'cust_current',
        last_name: 'Lovelace',
      },
    })
    const action = vi
      .fn()
      .mockRejectedValueOnce(spreeError(401))
      .mockResolvedValueOnce('customer')

    await expect(withCustomerSession(action)).resolves.toBe('customer')
    expect(action).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ token: 'access-token' }),
    )
    expect(action).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ token: 'next-access-token' }),
    )
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('does not refresh twice when a refresh-only session remains unauthorized', async () => {
    const { refresh } = setSpreeClient()
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'ada@example.com',
        first_name: 'Ada',
        id: 'cust_current',
        last_name: 'Lovelace',
      },
    })
    const action = vi.fn().mockRejectedValue(spreeError(401))

    await expect(withCustomerSession(action)).rejects.toBeInstanceOf(
      CustomerSessionRequiredError,
    )

    expect(refresh).toHaveBeenCalledOnce()
    expect(action).toHaveBeenCalledOnce()
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    )
  })

  it('does not refresh a newer customer session after the request owner changes', async () => {
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'ada@example.com',
        first_name: 'Ada',
        id: 'cust_current',
        last_name: 'Lovelace',
      },
    })
    vi.mocked(getCustomerRefreshToken)
      .mockReturnValueOnce('refresh-token')
      .mockReturnValue('new-customer-refresh-token')
    const action = vi
      .fn()
      .mockRejectedValueOnce(spreeError(401))
      .mockResolvedValueOnce('customer')

    await expect(withCustomerSession(action)).resolves.toBe('customer')

    expect(refresh).toHaveBeenCalledWith({ refresh_token: 'refresh-token' })
    expect(setCustomerAuthCookies).toHaveBeenCalledWith({
      expectedCurrentRefreshToken: 'refresh-token',
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })
    expect(action).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ token: 'next-access-token' }),
    )
  })

  it('does not run a customer action when refreshed tokens are not persisted', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'ada@example.com',
        first_name: 'Ada',
        id: 'cust_current',
        last_name: 'Lovelace',
      },
    })
    vi.mocked(setCustomerAuthCookies).mockReturnValue(false)
    const action = vi.fn(async () => 'customer')

    await expect(withCustomerSession(action)).rejects.toBeInstanceOf(
      CustomerSessionRequiredError,
    )
    expect(action).not.toHaveBeenCalled()
  })

  it('clears the session when the retry is also unauthorized', async () => {
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'ada@example.com',
        first_name: 'Ada',
        id: 'cust_current',
        last_name: 'Lovelace',
      },
    })
    const action = vi.fn().mockRejectedValue(spreeError(401))

    await expect(withCustomerSession(action)).rejects.toBeInstanceOf(
      CustomerSessionRequiredError,
    )
    expect(action).toHaveBeenCalledTimes(2)
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    )
  })

  it.each([403, 404, 429, 500, 503])(
    'does not refresh or clear the session for non-authentication failure %i',
    async (status) => {
      const { refresh } = setSpreeClient()
      const error = spreeError(status)

      await expect(
        withCustomerSession(async () => {
          throw error
        }),
      ).rejects.toBe(error)
      expect(refresh).not.toHaveBeenCalled()
      expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
    },
  )

  it('preserves the session when a retried action is forbidden after token refresh', async () => {
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        id: 'cust_current',
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
    })
    const forbidden = spreeError(403)
    const action = vi
      .fn()
      .mockRejectedValueOnce(spreeError(401))
      .mockRejectedValueOnce(forbidden)
    await expect(withCustomerSession(action)).rejects.toBe(forbidden)
    expect(refresh).toHaveBeenCalledOnce()
    expect(action).toHaveBeenCalledTimes(2)
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).not.toHaveBeenCalled()
  })

  it('preserves refresh cookies when the refresh endpoint returns a generic forbidden error', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    const forbidden = spreeError(403)
    refresh.mockRejectedValue(forbidden)
    const action = vi.fn()
    await expect(withCustomerSession(action)).rejects.toBe(forbidden)
    expect(action).not.toHaveBeenCalled()
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).not.toHaveBeenCalled()
  })

  it('clears a stale access session when no refresh credential remains', async () => {
    vi.mocked(getCustomerRefreshToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    const action = vi.fn().mockRejectedValue(spreeError(401))

    await expect(withCustomerSession(action)).rejects.toBeInstanceOf(
      CustomerSessionRequiredError,
    )

    expect(refresh).not.toHaveBeenCalled()
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      null,
    )
  })

  it('clears invalid refresh credentials and reports a missing session', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockRejectedValue(spreeError(401, 'invalid_refresh_token'))

    await expect(
      withCustomerSession(async () => 'customer'),
    ).rejects.toBeInstanceOf(CustomerSessionRequiredError)
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    )
  })

  it('does not clear a newer session when an old refresh credential is rejected', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    vi.mocked(clearCustomerAuthCookiesIfCurrentRefreshToken).mockReturnValue(
      false,
    )
    const { refresh } = setSpreeClient()
    refresh.mockRejectedValue(spreeError(401, 'invalid_refresh_token'))

    await expect(
      withCustomerSession(async () => 'customer'),
    ).rejects.toBeInstanceOf(CustomerSessionRequiredError)

    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    )
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('rejects a refresh response for a non-customer resource before persisting it', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
      user: {
        email: 'card@example.com',
        first_name: 'Card',
        id: 'card_123',
        last_name: 'Resource',
      },
    })

    await expect(withCustomerSession(async () => 'customer')).rejects.toThrow(
      'not a customer resource',
    )
    expect(setCustomerAuthCookies).not.toHaveBeenCalled()
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it.each([null, undefined, [], 'malformed'])(
    'rejects a malformed refresh response before persisting it: %o',
    async (response) => {
      vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
      const { refresh } = setSpreeClient()
      refresh.mockResolvedValue(response)

      await expect(
        withCustomerSession(async () => 'customer'),
      ).rejects.toBeInstanceOf(CustomerAuthResponseTypeMismatchError)
      expect(setCustomerAuthCookies).not.toHaveBeenCalled()
      expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
    },
  )

  it('preserves cookies when an initial or retry refresh fails transiently', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const firstClient = setSpreeClient()
    const initialRefreshError = spreeError(500)
    firstClient.refresh.mockRejectedValue(initialRefreshError)

    await expect(withCustomerSession(async () => 'customer')).rejects.toBe(
      initialRefreshError,
    )
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()

    vi.mocked(getCustomerAccessToken).mockReturnValue('access-token')
    const retryClient = setSpreeClient()
    const retryRefreshError = spreeError(503)
    retryClient.refresh.mockRejectedValue(retryRefreshError)

    await expect(
      withCustomerSession(async () => {
        throw spreeError(401)
      }),
    ).rejects.toBe(retryRefreshError)
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('coalesces concurrent refreshes that share a rotated token', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockImplementation(async () => {
      await Promise.resolve()

      return {
        refresh_token: 'next-refresh-token',
        token: 'next-access-token',
        user: {
          email: 'ada@example.com',
          first_name: 'Ada',
          id: 'cust_current',
          last_name: 'Lovelace',
        },
      }
    })
    const firstAction = vi.fn(async ({ token }: { token: string }) => token)
    const secondAction = vi.fn(async ({ token }: { token: string }) => token)

    await expect(
      Promise.all([
        withCustomerSession(firstAction),
        withCustomerSession(secondAction),
      ]),
    ).resolves.toEqual(['next-access-token', 'next-access-token'])
    expect(refresh).toHaveBeenCalledOnce()
    expect(setCustomerAuthCookies).toHaveBeenCalledOnce()
  })

  it('keeps the active cart cookie when association returns another cart', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart-other',
      market_id: 'market-us',
      token: 'other-cart-token',
    })
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart_current',
      cartMarketKey: 'market:market-us',
      cartToken: 'current-cart-token',
    })
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await persistCustomerAuthSession({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(associate).toHaveBeenCalledWith('cart_current', {
      spreeToken: 'current-cart-token',
      token: 'next-access-token',
    })
    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('uses a supplied market-specific client for guest-cart association', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_current',
      market_id: 'market-us',
      token: 'associated-cart-token',
    })
    const marketClient = {
      carts: { associate },
    }
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart_current',
      cartMarketKey: 'market:market-us',
      cartToken: 'current-cart-token',
    })

    await persistCustomerAuthSession({
      client: marketClient as never,
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(associate).toHaveBeenCalledWith('cart_current', {
      spreeToken: 'current-cart-token',
      token: 'next-access-token',
    })
    expect(getServerSpreeClient).not.toHaveBeenCalled()
    expect(setCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      {
        cartId: 'cart_current',
        cartMarketKey: 'market:market-us',
        cartToken: 'associated-cart-token',
      },
      'cart_current',
      'current-cart-token',
    )
  })

  it('does not persist an association response when cart projection fails', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const { mapSpreeCartToSummary } =
      await import('@/lib/cart/mappers/cart.mapper')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_current',
      market_id: 'market-us',
      token: 'associated-cart-token',
    })
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart_current',
      cartMarketKey: 'market:market-us',
      cartToken: 'current-cart-token',
    })
    vi.mocked(mapSpreeCartToSummary).mockImplementationOnce(() => {
      throw new Error('cart projection failed')
    })
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await persistCustomerAuthSession({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(associate).toHaveBeenCalled()
    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not associate a cart when auth tokens cannot be persisted', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart-current',
      cartMarketKey: 'market:market-us',
      cartToken: 'current-cart-token',
    })
    vi.mocked(setCustomerAuthCookies).mockReturnValue(false)
    const associate = vi.fn()
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await expect(
      persistCustomerAuthSession({
        refreshToken: 'refresh-token',
        token: 'access-token',
      }),
    ).rejects.toBeInstanceOf(CustomerSessionRequiredError)

    expect(associate).not.toHaveBeenCalled()
    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('keeps the active cart cookie when association returns another market', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const associate = vi.fn().mockResolvedValue({
      currency: 'EUR',
      id: 'cart-current',
      market_id: 'market-eu',
      token: 'other-market-token',
    })
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart-current',
      cartMarketKey: 'market:market-us',
      cartToken: 'current-cart-token',
    })
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await persistCustomerAuthSession({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not associate a cart when its market ownership hint is missing', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const associate = vi.fn()
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart-current',
      cartToken: 'current-cart-token',
    })
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await persistCustomerAuthSession({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(associate).not.toHaveBeenCalled()
    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not associate a cart with a whitespace-only token', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const associate = vi.fn()
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart-current',
      cartMarketKey: 'market:market-us',
      cartToken: '   ',
    })
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await persistCustomerAuthSession({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(associate).not.toHaveBeenCalled()
    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not associate a non-cart cookie resource', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const associate = vi.fn()
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'or_completed-order',
      cartMarketKey: 'market:market-us',
      cartToken: 'current-cart-token',
    })
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await persistCustomerAuthSession({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(associate).not.toHaveBeenCalled()
    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('does not persist an association response without a usable token', async () => {
    const { getCartCookieState, setCartCookiesIfCurrentCartMatches } =
      await import('@/lib/cookies/cart-cookie.server')
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart-current',
      market_id: 'market-us',
    })
    vi.mocked(getCartCookieState).mockReturnValue({
      cartId: 'cart-current',
      cartMarketKey: 'market:market-us',
      cartToken: 'current-cart-token',
    })
    vi.mocked(getServerSpreeClient).mockReturnValue({
      carts: { associate },
    } as never)

    await persistCustomerAuthSession({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })

    expect(setCartCookiesIfCurrentCartMatches).not.toHaveBeenCalled()
  })

  it('logs out through Spree before clearing the current auth session', async () => {
    const { clearCartCookies } =
      await import('@/lib/cookies/cart-cookie.server')
    const logout = vi.fn().mockResolvedValue(undefined)
    vi.mocked(getServerSpreeClient).mockReturnValue({
      auth: { logout },
    } as never)

    await expect(logoutCustomerOnServer()).resolves.toEqual({ success: true })

    expect(logout).toHaveBeenCalledWith({ refresh_token: 'refresh-token' })
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    )
    expect(clearCartCookies).toHaveBeenCalledOnce()
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('uses a supplied market-specific client for logout', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    const suppliedClient = { auth: { logout } }

    await expect(
      logoutCustomerOnServer({ client: suppliedClient as never }),
    ).resolves.toEqual({ success: true })

    expect(logout).toHaveBeenCalledWith({ refresh_token: 'refresh-token' })
    expect(getServerSpreeClient).not.toHaveBeenCalled()
  })

  it('still clears the current auth session when Spree logout fails', async () => {
    const { clearCartCookies } =
      await import('@/lib/cookies/cart-cookie.server')
    const logout = vi.fn().mockRejectedValue(new Error('network failure'))
    vi.mocked(getServerSpreeClient).mockReturnValue({
      auth: { logout },
    } as never)

    await expect(logoutCustomerOnServer()).resolves.toEqual({ success: true })

    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    )
    expect(clearCartCookies).toHaveBeenCalledOnce()
  })

  it('does not send an API logout request without a refresh token', async () => {
    const { clearCartCookies } =
      await import('@/lib/cookies/cart-cookie.server')
    const logout = vi.fn()
    vi.mocked(getCustomerRefreshToken).mockReturnValue(undefined)
    vi.mocked(getServerSpreeClient).mockReturnValue({
      auth: { logout },
    } as never)

    await expect(logoutCustomerOnServer()).resolves.toEqual({ success: true })

    expect(logout).not.toHaveBeenCalled()
    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      null,
    )
    expect(clearCartCookies).toHaveBeenCalledOnce()
  })

  it('does not clear a newer session or its cart from a stale logout response', async () => {
    const { clearCartCookies } =
      await import('@/lib/cookies/cart-cookie.server')
    const logout = vi.fn().mockResolvedValue(undefined)
    vi.mocked(getServerSpreeClient).mockReturnValue({
      auth: { logout },
    } as never)
    vi.mocked(clearCustomerAuthCookiesIfCurrentRefreshToken).mockReturnValue(
      false,
    )

    await expect(logoutCustomerOnServer()).resolves.toEqual({ success: true })

    expect(clearCustomerAuthCookiesIfCurrentRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    )
    expect(clearCartCookies).not.toHaveBeenCalled()
  })
})
