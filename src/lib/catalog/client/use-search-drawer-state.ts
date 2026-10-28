import { useDeferredValue, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import { getSearchDrawerMode } from '../utils/search-drawer'
import { useProductSearchPreview } from './use-product-search-preview'
import { useSearchSuggestions } from './use-search-suggestions'

export function useSearchDrawerState({
  enabled,
  market,
}: {
  enabled: boolean
  market: MarketSelectionInput
}) {
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const activeSearchQuery = useDeferredValue(trimmedQuery)
  const searchMode = getSearchDrawerMode(activeSearchQuery)
  const previewQuery = useProductSearchPreview({
    enabled: enabled && searchMode === 'preview',
    market,
    query: activeSearchQuery,
  })
  const suggestionsQuery = useSearchSuggestions({
    enabled: enabled && searchMode === 'suggestions',
    market,
  })

  return {
    activeSearchQuery,
    onChangeQuery: setQuery,
    previewQuery,
    query,
    reset: () => setQuery(''),
    searchMode,
    suggestionsQuery,
  }
}
