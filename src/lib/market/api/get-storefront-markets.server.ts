import '@tanstack/react-start/server-only'

import { getServerSpreeClient } from '@/lib/spree/client.server'

import { mapSpreeMarketsToStorefrontMarkets } from '../mappers/market.mapper'
import { assertMarketListResponse } from '../utils/market-list-response'
import { assertMarketResponse } from '../utils/market-resource-identity'
import { FALLBACK_STOREFRONT_MARKETS } from '../utils/market'
import type { StorefrontMarket } from '@/lib/core/market'
import { normalizeCountry, normalizeLocale } from '@/lib/core/market'
import { listMarketsWithExpandedCountries } from './list-markets-with-expanded-countries'

type StorefrontMarketsInput = {
  country?: string
  locale?: string
}

type StorefrontMarketsOptions = {
  allowDevelopmentFallback?: boolean
}

export class StorefrontMarketsUnavailableError extends Error {
  readonly code = 'storefront_markets_unavailable'

  constructor() {
    super('Storefront markets are unavailable.')
    this.name = 'StorefrontMarketsUnavailableError'
  }
}

export function resolveStorefrontMarkets(
  markets: StorefrontMarket[],
  {
    allowDevelopmentFallback = true,
    production = import.meta.env.PROD,
  }: StorefrontMarketsOptions & { production?: boolean } = {},
) {
  if (markets.length > 0) {
    return markets
  }

  if (production || !allowDevelopmentFallback) {
    throw new StorefrontMarketsUnavailableError()
  }

  return FALLBACK_STOREFRONT_MARKETS
}

export async function getStorefrontMarketsForRequest(
  input: StorefrontMarketsInput = {},
  { allowDevelopmentFallback = true }: StorefrontMarketsOptions = {},
): Promise<StorefrontMarket[]> {
  try {
    const locale = normalizeLocale(input.locale)
    const response = await listMarketsWithExpandedCountries(
      getServerSpreeClient(),
      {
        country: normalizeCountry(input.country).toUpperCase(),
        locale,
      },
    )
    assertMarketListResponse(response)
    response.data.forEach(assertMarketResponse)
    const markets = mapSpreeMarketsToStorefrontMarkets(response.data, locale)

    return resolveStorefrontMarkets(markets, { allowDevelopmentFallback })
  } catch (error) {
    if (error instanceof StorefrontMarketsUnavailableError) {
      throw error
    }

    return resolveStorefrontMarkets([], { allowDevelopmentFallback })
  }
}
