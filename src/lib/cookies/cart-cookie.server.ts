import '@tanstack/react-start/server-only'

import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/start-server-core/request-response'

const CART_ID_COOKIE = 'spree_storefront_cart_id'
const CART_MARKET_COOKIE = 'spree_storefront_cart_market'
const CART_TOKEN_COOKIE = 'spree_storefront_cart_token'
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export type CartCookieState = {
  cartId?: string
  cartMarketKey?: string
  cartToken?: string
}

export function normalizeCartToken(value: unknown) {
  const token = typeof value === 'string' ? value.trim() : undefined

  return token || undefined
}

function getCartCookieOptions() {
  return {
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function getCartCookieState(): CartCookieState {
  return {
    cartId: getCookie(CART_ID_COOKIE),
    cartMarketKey: getCookie(CART_MARKET_COOKIE),
    cartToken: normalizeCartToken(getCookie(CART_TOKEN_COOKIE)),
  }
}

export function isCartCookieStateIncomplete(state: CartCookieState) {
  const hasCartId = Boolean(state.cartId)
  const hasCartToken = Boolean(state.cartToken)

  return (
    hasCartId !== hasCartToken ||
    (!hasCartId && !hasCartToken && Boolean(state.cartMarketKey))
  )
}

export function setCartCookies({
  cartId,
  cartMarketKey,
  cartToken,
}: {
  cartId: string
  cartMarketKey?: string | null
  cartToken: string
}): boolean {
  const normalizedCartToken = normalizeCartToken(cartToken)

  if (!normalizedCartToken) {
    return false
  }

  const options = getCartCookieOptions()

  setCookie(CART_ID_COOKIE, cartId, options)
  if (cartMarketKey) {
    setCookie(CART_MARKET_COOKIE, cartMarketKey, options)
  } else {
    deleteCookie(CART_MARKET_COOKIE, {
      path: '/',
    })
  }
  setCookie(CART_TOKEN_COOKIE, normalizedCartToken, options)

  return true
}

export function setCartCookiesIfCurrentCart(
  cookies: Parameters<typeof setCartCookies>[0],
  expectedCartId: string,
  expectedCurrentCartToken?: string,
) {
  const currentState = getCartCookieState()
  const currentCartId = currentState.cartId

  if (currentCartId && currentCartId !== expectedCartId) {
    return false
  }

  if (
    currentCartId === expectedCartId &&
    expectedCurrentCartToken !== undefined &&
    currentState.cartToken !== normalizeCartToken(expectedCurrentCartToken)
  ) {
    return false
  }

  return setCartCookies(cookies)
}

export function setCartCookiesIfCurrentCartMatches(
  cookies: Parameters<typeof setCartCookies>[0],
  expectedCurrentCartId?: string,
  expectedCurrentCartToken?: string,
) {
  const currentState = getCartCookieState()
  const currentCartId = currentState.cartId

  if (expectedCurrentCartId) {
    if (currentCartId !== expectedCurrentCartId) {
      return false
    }
  } else if (currentCartId) {
    return false
  }

  if (
    expectedCurrentCartId &&
    expectedCurrentCartToken !== undefined &&
    currentState.cartToken !== normalizeCartToken(expectedCurrentCartToken)
  ) {
    return false
  }

  return setCartCookies(cookies)
}

export function clearCartCookiesIfCurrentCartMatches(
  expectedCurrentCartId: string,
  expectedCurrentCartToken?: string,
) {
  const currentState = getCartCookieState()

  if (currentState.cartId !== expectedCurrentCartId) {
    return false
  }

  if (
    expectedCurrentCartToken !== undefined &&
    currentState.cartToken !== normalizeCartToken(expectedCurrentCartToken)
  ) {
    return false
  }

  clearCartCookies()

  return true
}

export function clearCartCookies() {
  deleteCookie(CART_ID_COOKIE, {
    path: '/',
  })
  deleteCookie(CART_MARKET_COOKIE, {
    path: '/',
  })
  deleteCookie(CART_TOKEN_COOKIE, {
    path: '/',
  })
}
