import '@tanstack/react-start/server-only'

import { getServerSpreeClient } from '@/lib/spree/client.server'

import { mapSpreeMarketsToStorefrontMarkets } from '../mappers/market.mapper'
import type { StorefrontMarket } from '../model/market'
import { FALLBACK_STOREFRONT_MARKETS } from '../utils/market'
import { normalizeCountry, normalizeLocale } from '../utils/market-format'

type StorefrontMarketsInput = {
  country?: string
  locale?: string
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
  { production = import.meta.env.PROD }: { production?: boolean } = {},
) {
  if (markets.length > 0) {
    return markets
  }

  if (production) {
    throw new StorefrontMarketsUnavailableError()
  }

  return FALLBACK_STOREFRONT_MARKETS
}

export async function getStorefrontMarketsForRequest(
  input: StorefrontMarketsInput = {},
): Promise<StorefrontMarket[]> {
  try {
    const locale = normalizeLocale(input.locale)
    const response = await getServerSpreeClient().markets.list({
      country: normalizeCountry(input.country).toUpperCase(),
      locale,
    })
    const markets = mapSpreeMarketsToStorefrontMarkets(response.data, locale)

    return resolveStorefrontMarkets(markets)
  } catch (error) {
    if (error instanceof StorefrontMarketsUnavailableError) {
      throw error
    }

    return resolveStorefrontMarkets([])
  }
}
