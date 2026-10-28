import '@tanstack/react-start/server-only'

import type { MarketSelectionInput, ResolvedMarket } from '@/lib/core/market'
import { resolveMarketSelection } from '../utils/market'

export async function resolveServerMarket(
  input: MarketSelectionInput,
): Promise<ResolvedMarket> {
  const selection = {
    country: input.country,
    locale: input.locale,
  }
  const { getStorefrontMarketsForRequest, StorefrontMarketsUnavailableError } =
    await import('./get-storefront-markets.server')
  const marketOptions = await getStorefrontMarketsForRequest(
    {
      ...selection,
    },
    {
      allowDevelopmentFallback: false,
    },
  )

  if (marketOptions.length === 0) {
    throw new StorefrontMarketsUnavailableError()
  }

  return resolveMarketSelection(marketOptions, selection).market
}
