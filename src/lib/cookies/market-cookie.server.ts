import '@tanstack/react-start/server-only'

import { setCookie } from '@tanstack/react-start/server'

import type { ResolvedMarket } from '@/lib/market/model/market'

import {
  MARKET_COOKIE_MAX_AGE,
  MARKET_COUNTRY_COOKIE,
  MARKET_LOCALE_COOKIE,
} from './market-cookie'

function getCookieOptions() {
  return {
    path: '/',
    maxAge: MARKET_COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function setPreferredMarketCookies(
  market: Pick<ResolvedMarket, 'country' | 'locale'>,
) {
  const options = getCookieOptions()

  setCookie(MARKET_COUNTRY_COOKIE, market.country, options)
  setCookie(MARKET_LOCALE_COOKIE, market.locale, options)
}
