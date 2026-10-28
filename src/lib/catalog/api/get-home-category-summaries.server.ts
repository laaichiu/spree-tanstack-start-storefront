import '@tanstack/react-start/server-only'

import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeCategoriesToHomeSummaries } from '../mappers/category.mapper'
import { assertCatalogListResponse } from '../utils/catalog-list-response'
import { assertCatalogCategoryTreeResourcesAreCategories } from '../utils/catalog-resource-identity'

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
  assertCatalogListResponse(response)
  assertCatalogCategoryTreeResourcesAreCategories(response.data)

  return mapSpreeCategoriesToHomeSummaries(response.data, limit)
}
