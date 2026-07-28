import '@tanstack/react-start/server-only'

import { getRequestHeader } from '@tanstack/react-start/server'

import {
  getMarketPathFromCookieSource,
  resolveMarketFromCookieSource,
} from '@/lib/cookies/market-cookie'
import {
  getDefaultResolvedMarket,
  getMarketPath,
} from '@/lib/market/utils/market'

import { getStorefrontMarketsForRequest } from './get-storefront-markets.server'

async function getPreferredMarketForRequest() {
  const marketOptions = await getStorefrontMarketsForRequest()
  const cookieSource = getRequestHeader('cookie')

  return (
    resolveMarketFromCookieSource(cookieSource, marketOptions) ??
    getDefaultResolvedMarket(marketOptions)
  )
}

export async function getPreferredMarketPathForRequest() {
  const cookiePath = getMarketPathFromCookieSource(getRequestHeader('cookie'))

  if (cookiePath) {
    return cookiePath
  }

  return getMarketPath(await getPreferredMarketForRequest())
}
