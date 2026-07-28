import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'
import { getFeaturedProductSummaries } from '@/lib/catalog/api/get-featured-product-summaries'

import { SEARCH_SUGGESTION_LIMIT } from './search-drawer.model'

const searchSuggestionsQueryKey = ['search-suggestions'] as const

export function useSearchSuggestions({ enabled }: { enabled: boolean }) {
  const { market } = useMarket()
  const getFeaturedProductSummariesFn = useServerFn(getFeaturedProductSummaries)

  return useQuery({
    enabled,
    queryFn: () =>
      getFeaturedProductSummariesFn({
        data: {
          limit: SEARCH_SUGGESTION_LIMIT,
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      }),
    queryKey: [
      ...searchSuggestionsQueryKey,
      market.country,
      market.locale,
      SEARCH_SUGGESTION_LIMIT,
    ],
    staleTime: 60_000,
  })
}
