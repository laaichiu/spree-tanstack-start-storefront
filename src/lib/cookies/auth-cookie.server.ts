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

function normalizeStoredToken(token: string | undefined) {
  const normalizedToken = token?.trim()

  return normalizedToken || undefined
}

export function getCustomerAccessToken() {
  return normalizeStoredToken(getCookie(CUSTOMER_ACCESS_TOKEN_COOKIE))
}

export function getCustomerRefreshToken() {
  return normalizeStoredToken(getCookie(CUSTOMER_REFRESH_TOKEN_COOKIE))
}

export function setCustomerAuthCookies({
  refreshToken,
  token,
  expectedCurrentRefreshToken,
}: {
  refreshToken: string
  token: string
  expectedCurrentRefreshToken?: string
}) {
  const normalizedToken = normalizeStoredToken(token)
  const normalizedRefreshToken = normalizeStoredToken(refreshToken)

  if (!normalizedToken || !normalizedRefreshToken) {
    return false
  }

  if (
    expectedCurrentRefreshToken !== undefined &&
    getCustomerRefreshToken() !==
      normalizeStoredToken(expectedCurrentRefreshToken)
  ) {
    return false
  }

  setCookie(
    CUSTOMER_ACCESS_TOKEN_COOKIE,
    normalizedToken,
    getAuthCookieOptions(CUSTOMER_ACCESS_TOKEN_MAX_AGE),
  )
  setCookie(
    CUSTOMER_REFRESH_TOKEN_COOKIE,
    normalizedRefreshToken,
    getAuthCookieOptions(CUSTOMER_REFRESH_TOKEN_MAX_AGE),
  )

  return true
}

export function clearCustomerAuthCookies() {
  deleteCookie(CUSTOMER_ACCESS_TOKEN_COOKIE, {
    path: '/',
  })
  deleteCookie(CUSTOMER_REFRESH_TOKEN_COOKIE, {
    path: '/',
  })
}

export function clearCustomerAuthCookiesIfCurrentRefreshToken(
  expectedCurrentRefreshToken?: string | null,
) {
  if (
    expectedCurrentRefreshToken !== undefined &&
    getCustomerRefreshToken() !==
      normalizeStoredToken(expectedCurrentRefreshToken ?? undefined)
  ) {
    return false
  }

  clearCustomerAuthCookies()

  return true
}
