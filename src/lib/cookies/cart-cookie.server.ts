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

function getCartCookieOptions() {
  return {
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function getCartCookieState() {
  return {
    cartId: getCookie(CART_ID_COOKIE),
    cartMarketKey: getCookie(CART_MARKET_COOKIE),
    cartToken: getCookie(CART_TOKEN_COOKIE),
  }
}

export function setCartCookies({
  cartId,
  cartMarketKey,
  cartToken,
}: {
  cartId: string
  cartMarketKey?: string | null
  cartToken: string
}) {
  const options = getCartCookieOptions()

  setCookie(CART_ID_COOKIE, cartId, options)
  if (cartMarketKey) {
    setCookie(CART_MARKET_COOKIE, cartMarketKey, options)
  } else {
    deleteCookie(CART_MARKET_COOKIE, {
      path: '/',
    })
  }
  setCookie(CART_TOKEN_COOKIE, cartToken, options)
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
