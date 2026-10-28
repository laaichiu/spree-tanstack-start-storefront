// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getCartCookieState,
  isCartCookieStateIncomplete,
  clearCartCookiesIfCurrentCartMatches,
  setCartCookiesIfCurrentCart,
  setCartCookiesIfCurrentCartMatches,
} from './cart-cookie.server'

const server = vi.hoisted(() => ({
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}))

vi.mock('@tanstack/react-start/server-only', () => ({}))

vi.mock('@tanstack/start-server-core/request-response', () => ({
  deleteCookie: server.deleteCookie,
  getCookie: server.getCookie,
  setCookie: server.setCookie,
}))

const cookies = {
  cartId: 'cart-next',
  cartMarketKey: 'market:market-us',
  cartToken: 'cart-token',
}

afterEach(() => {
  vi.clearAllMocks()
  server.getCookie.mockReset()
})

describe('cart cookie ownership', () => {
  it('normalizes stored cart tokens before exposing cookie state', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_token' ? ' cart-token ' : undefined,
    )

    expect(getCartCookieState()).toEqual({
      cartId: undefined,
      cartMarketKey: undefined,
      cartToken: 'cart-token',
    })
  })

  it('treats a whitespace-only stored cart token as absent', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_token' ? '   ' : undefined,
    )

    expect(getCartCookieState().cartToken).toBeUndefined()
  })

  it('recognizes incomplete cart cookie triples', () => {
    expect(
      isCartCookieStateIncomplete({
        cartId: 'cart-next',
        cartToken: undefined,
      }),
    ).toBe(true)
    expect(
      isCartCookieStateIncomplete({
        cartId: undefined,
        cartMarketKey: 'market:market-us',
        cartToken: undefined,
      }),
    ).toBe(true)
    expect(
      isCartCookieStateIncomplete({
        cartId: 'cart-next',
        cartMarketKey: 'market:market-us',
        cartToken: 'cart-token',
      }),
    ).toBe(false)
  })

  it('writes a response when the current cart is still the requested cart', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id' ? 'cart-next' : undefined,
    )

    expect(setCartCookiesIfCurrentCart(cookies, 'cart-next')).toBe(true)
    expect(server.setCookie).toHaveBeenCalledTimes(3)
  })

  it('does not let a stale response replace another active cart', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id' ? 'cart-current' : undefined,
    )

    expect(setCartCookiesIfCurrentCart(cookies, 'cart-next')).toBe(false)
    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('does not let an older response replace a rotated token for the same cart', () => {
    server.getCookie.mockImplementation((name: string) => {
      if (name === 'spree_storefront_cart_id') {
        return 'cart-next'
      }

      if (name === 'spree_storefront_cart_token') {
        return 'rotated-token'
      }

      return undefined
    })

    expect(
      setCartCookiesIfCurrentCart(
        {
          ...cookies,
          cartToken: 'older-token',
        },
        'cart-next',
        'request-token',
      ),
    ).toBe(false)
    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('allows initializing a cart when no cart identity exists yet', () => {
    server.getCookie.mockReturnValue(undefined)

    expect(setCartCookiesIfCurrentCart(cookies, 'cart-next')).toBe(true)
    expect(server.setCookie).toHaveBeenCalledTimes(3)
  })

  it('trims a cart token before writing the shared cookie', () => {
    server.getCookie.mockReturnValue(undefined)

    expect(
      setCartCookiesIfCurrentCart(
        {
          ...cookies,
          cartToken: ' cart-token ',
        },
        'cart-next',
      ),
    ).toBe(true)

    expect(server.setCookie).toHaveBeenNthCalledWith(
      3,
      'spree_storefront_cart_token',
      'cart-token',
      expect.anything(),
    )
  })

  it('does not write a whitespace-only cart token', () => {
    server.getCookie.mockReturnValue(undefined)

    expect(
      setCartCookiesIfCurrentCart(
        {
          ...cookies,
          cartToken: '   ',
        },
        'cart-next',
      ),
    ).toBe(false)

    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('allows an intentional cart replacement while the previous owner is current', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id' ? 'cart-old' : undefined,
    )

    expect(setCartCookiesIfCurrentCartMatches(cookies, 'cart-old')).toBe(true)
    expect(server.setCookie).toHaveBeenCalledTimes(3)
  })

  it('does not replace a cart that changed before an intentional replacement', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id' ? 'cart-current' : undefined,
    )

    expect(setCartCookiesIfCurrentCartMatches(cookies, 'cart-old')).toBe(false)
    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('does not replace a cart when its token changed before an intentional replacement', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id'
        ? 'cart-old'
        : name === 'spree_storefront_cart_token'
          ? 'rotated-token'
          : undefined,
    )

    expect(
      setCartCookiesIfCurrentCartMatches(cookies, 'cart-old', 'request-token'),
    ).toBe(false)
    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('does not resurrect a stale cart after its cookie session was cleared', () => {
    server.getCookie.mockReturnValue(undefined)

    expect(
      setCartCookiesIfCurrentCartMatches(cookies, 'cart-old', 'cart-token'),
    ).toBe(false)
    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('clears only when the current cart is still the expected owner', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id' ? 'cart-old' : undefined,
    )

    expect(clearCartCookiesIfCurrentCartMatches('cart-old')).toBe(true)
    expect(server.deleteCookie).toHaveBeenCalledTimes(3)
  })

  it('does not clear a cart that changed before recovery cleanup', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id' ? 'cart-current' : undefined,
    )

    expect(clearCartCookiesIfCurrentCartMatches('cart-old')).toBe(false)
    expect(server.deleteCookie).not.toHaveBeenCalled()
  })

  it('does not clear a same-cart session after its token changes', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id'
        ? 'cart-old'
        : name === 'spree_storefront_cart_token'
          ? 'rotated-token'
          : undefined,
    )

    expect(
      clearCartCookiesIfCurrentCartMatches('cart-old', 'request-token'),
    ).toBe(false)
    expect(server.deleteCookie).not.toHaveBeenCalled()
  })

  it('clears a same-cart session when its token still matches', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_cart_id'
        ? 'cart-old'
        : name === 'spree_storefront_cart_token'
          ? 'request-token'
          : undefined,
    )

    expect(
      clearCartCookiesIfCurrentCartMatches('cart-old', ' request-token '),
    ).toBe(true)
    expect(server.deleteCookie).toHaveBeenCalledTimes(3)
  })
})
