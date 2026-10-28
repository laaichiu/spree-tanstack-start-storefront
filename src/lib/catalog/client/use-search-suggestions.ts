import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'
import {
  getSearchSuggestionCategories,
  getSearchSuggestionProducts,
} from '../api/get-search-suggestions'

const searchSuggestionsQueryKey = ['search-suggestions'] as const

export function useSearchSuggestions({
  enabled,
  market,
}: {
  enabled: boolean
  market: MarketSelectionInput
}) {
  const getProducts = useServerFn(getSearchSuggestionProducts)

  return useQuery({
    enabled,
    queryFn: () =>
      getProducts({
        data: {
          country: market.country,
          locale: market.locale,
        },
      }),
    queryKey: [
      ...searchSuggestionsQueryKey,
      'products',
      market.country,
      market.locale,
    ],
    staleTime: 60_000,
  })
}

export function useSearchSuggestionCategories({
  enabled,
  market,
}: {
  enabled: boolean
  market: MarketSelectionInput
}) {
  const getCategories = useServerFn(getSearchSuggestionCategories)
  return useQuery({
    enabled,
    queryFn: () =>
      getCategories({
        data: { country: market.country, locale: market.locale },
      }),
    queryKey: [
      ...searchSuggestionsQueryKey,
      'categories',
      market.country,
      market.locale,
    ],
    staleTime: 60_000,
  })
}
