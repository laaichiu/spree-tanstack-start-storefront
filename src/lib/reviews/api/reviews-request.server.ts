import '@tanstack/react-start/server-only'

import type { RequestOptions } from '@spree/sdk'

import type {
  MarketSelectionInput,
  ResolvedMarket,
} from '@/lib/market/model/market'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { isReviewsFeatureEnabled } from '../config/reviews-config.server'

export async function resolveReviewsRequestContext(
  marketInput: MarketSelectionInput,
) {
  if (!isReviewsFeatureEnabled()) {
    return null
  }

  const market = await resolveServerMarket(marketInput)

  return {
    client: getServerSpreeClientForMarket(market),
    market,
  }
}

export function getReviewsRequestOptions(
  market: ResolvedMarket,
  token?: string,
): RequestOptions {
  return {
    country: market.country,
    currency: market.currencyCode,
    locale: market.locale,
    ...(token ? { token } : {}),
  }
}

export function productReviewsPath(productId: string, suffix = '') {
  return `/products/${encodeURIComponent(productId)}/reviews${suffix}`
}
