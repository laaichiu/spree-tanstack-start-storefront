import '@tanstack/react-start/server-only'

import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/start-server-core/request-response'

const CUSTOMER_ACCESS_TOKEN_COOKIE = 'spree_storefront_customer_token'
const CUSTOMER_REFRESH_TOKEN_COOKIE = 'spree_storefront_customer_refresh_token'
const CUSTOMER_ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7
const CUSTOMER_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30

function getAuthCookieOptions(maxAge: number) {
  return {
    path: '/',
    maxAge,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function getCustomerAccessToken() {
  return getCookie(CUSTOMER_ACCESS_TOKEN_COOKIE)
}

export function getCustomerRefreshToken() {
  return getCookie(CUSTOMER_REFRESH_TOKEN_COOKIE)
}

export function setCustomerAuthCookies({
  refreshToken,
  token,
}: {
  refreshToken: string
  token: string
}) {
  setCookie(
    CUSTOMER_ACCESS_TOKEN_COOKIE,
    token,
    getAuthCookieOptions(CUSTOMER_ACCESS_TOKEN_MAX_AGE),
  )
  setCookie(
    CUSTOMER_REFRESH_TOKEN_COOKIE,
    refreshToken,
    getAuthCookieOptions(CUSTOMER_REFRESH_TOKEN_MAX_AGE),
  )
}

export function clearCustomerAuthCookies() {
  deleteCookie(CUSTOMER_ACCESS_TOKEN_COOKIE, {
    path: '/',
  })
  deleteCookie(CUSTOMER_REFRESH_TOKEN_COOKIE, {
    path: '/',
  })
}
