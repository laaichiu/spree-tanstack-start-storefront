import '@tanstack/react-start/server-only'

import type { MarketSelectionInput, ResolvedMarket } from '../model/market'
import { resolveMarketSelection } from '../utils/market'

export async function resolveServerMarket(
  input: MarketSelectionInput,
): Promise<ResolvedMarket> {
  const selection = {
    country: input.country,
    locale: input.locale,
  }
  const { getStorefrontMarketsForRequest } =
    await import('./get-storefront-markets.server')
  const marketOptions = await getStorefrontMarketsForRequest({
    ...selection,
  })

  return resolveMarketSelection(marketOptions, selection).market
}
