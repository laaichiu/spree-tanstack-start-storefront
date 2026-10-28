import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'
import { SEARCH_PREVIEW_LIMIT } from '@/lib/catalog/contracts'

import { getProductsPageSummaries } from '../api/get-products-page-summaries'

const productSearchPreviewQueryKey = ['product-search-preview'] as const

export function useProductSearchPreview({
  enabled,
  limit = SEARCH_PREVIEW_LIMIT,
  market,
  query,
}: {
  enabled: boolean
  limit?: number
  market: MarketSelectionInput
  query: string
}) {
  const getProductsPageSummariesFn = useServerFn(getProductsPageSummaries)
  const trimmedQuery = query.trim()

  return useQuery({
    enabled: enabled && trimmedQuery.length > 0,
    queryFn: () =>
      getProductsPageSummariesFn({
        data: {
          limit,
          market: {
            country: market.country,
            locale: market.locale,
          },
          page: 1,
          query: trimmedQuery,
        },
      }),
    queryKey: [
      ...productSearchPreviewQueryKey,
      market.country,
      market.locale,
      trimmedQuery,
      limit,
    ],
    staleTime: 30_000,
  })
}
