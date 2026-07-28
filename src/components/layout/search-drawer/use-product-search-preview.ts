import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'

import { getProductsPageSummaries } from '@/lib/catalog/api/get-products-page-summaries'

const productSearchPreviewQueryKey = ['product-search-preview'] as const

export function useProductSearchPreview({
  enabled,
  limit = 4,
  query,
}: {
  enabled: boolean
  limit?: number
  query: string
}) {
  const { market } = useMarket()
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
