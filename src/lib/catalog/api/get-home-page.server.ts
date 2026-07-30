import '@tanstack/react-start/server-only'

import type { ResolvedMarket } from '@/lib/market/model/market'
import { reportError } from '@/lib/observability/report-error'

import { getFeaturedProductSummariesForMarket } from './get-featured-product-summaries.server'
import { getHomeCategorySummariesForMarket } from './get-home-category-summaries.server'
import { loadHomePage } from './get-home-page-loader'

export function loadHomePageForMarket(market: ResolvedMarket) {
  return loadHomePage(
    { market },
    {
      loadFeaturedCategories: () =>
        getHomeCategorySummariesForMarket({
          limit: 6,
          market,
        }),
      loadFeaturedProducts: () =>
        getFeaturedProductSummariesForMarket({
          limit: 12,
          market,
        }),
      reportError,
    },
  )
}
