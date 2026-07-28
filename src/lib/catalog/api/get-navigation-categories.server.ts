import '@tanstack/react-start/server-only'

import type { ResolvedMarket } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeCategoriesToNavigationItems } from '../mappers/category.mapper'

export async function getNavigationCategoriesForMarket({
  limit = 7,
  market,
}: {
  limit?: number
  market: ResolvedMarket
}) {
  const response = await getServerSpreeClientForMarket(market).categories.list({
    limit: 64,
  })

  return mapSpreeCategoriesToNavigationItems(response.data, limit)
}
