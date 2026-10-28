import '@tanstack/react-start/server-only'

import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { getProductSummaries } from './get-product-summaries'

export async function getFeaturedProductSummariesForMarket({
  limit = 4,
  market,
}: {
  limit?: number
  market: ResolvedMarket
}) {
  return getProductSummaries(getServerSpreeClientForMarket(market), {
    limit,
    sort: '-created_at',
  })
}
