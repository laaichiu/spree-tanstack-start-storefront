import '@tanstack/react-start/server-only'

import { setPreferredMarketCookies } from '@/lib/cookies/market-cookie.server'
import type { ResolvedMarket } from '@/lib/market/model/market'

import { marketInputSchema } from '../utils/market-input'
import { resolveMarketSelection } from '../utils/market'
import { getStorefrontMarketsForRequest } from './get-storefront-markets.server'

function setResolvedMarketPreferenceForRequest(market: ResolvedMarket) {
  setPreferredMarketCookies(market)

  return market
}

export async function persistMarketPreferenceForRequest(input: unknown) {
  const data = marketInputSchema.parse(input)
  const marketOptions = await getStorefrontMarketsForRequest({
    country: data.country,
    locale: data.locale,
  })
  const { market } = resolveMarketSelection(marketOptions, data)

  return setResolvedMarketPreferenceForRequest(market)
}
