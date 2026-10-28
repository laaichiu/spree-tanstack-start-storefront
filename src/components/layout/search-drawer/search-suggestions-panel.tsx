import type { ProductSummary } from '@/lib/catalog/contracts'
import { SearchSuggestionsPanelView } from '@/components/layout/search-suggestions-panel-view'

import { SearchDrawerCategoryLinks } from './search-drawer-category-links'
import { SearchPopularSearches } from './search-popular-searches'
import { SearchSuggestedItems } from './search-suggested-items'

type SearchSuggestionsPanelProps = {
  failed: boolean
  loading: boolean
  onNavigateToSearchResults: (query: string) => void
  onRetry: () => void
  onSelect: () => void
  open: boolean
  products: ProductSummary[]
}

export function SearchSuggestionsPanel({
  failed,
  loading,
  onNavigateToSearchResults,
  onRetry,
  onSelect,
  open,
  products,
}: SearchSuggestionsPanelProps) {
  return (
    <SearchSuggestionsPanelView
      slots={{
        categoryLinks: (
          <SearchDrawerCategoryLinks onSelect={onSelect} open={open} />
        ),
        popularSearches: (
          <SearchPopularSearches
            onNavigateToSearchResults={onNavigateToSearchResults}
          />
        ),
        suggestedItems: (
          <SearchSuggestedItems
            failed={failed}
            loading={loading}
            onRetry={onRetry}
            onSelect={onSelect}
            open={open}
            products={products}
          />
        ),
      }}
    />
  )
}
