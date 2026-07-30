import '@tanstack/react-start/server-only'

import type { ResolvedMarket } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeCategoriesToHomeSummaries } from '../mappers/category.mapper'

export async function getHomeCategorySummariesForMarket({
  limit = 6,
  market,
}: {
  limit?: number
  market: ResolvedMarket
}) {
  const response = await getServerSpreeClientForMarket(market).categories.list({
    limit: 48,
  })

  return mapSpreeCategoriesToHomeSummaries(response.data, limit)
}
