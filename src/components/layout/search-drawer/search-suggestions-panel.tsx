import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import type { ProductSummary } from '@/lib/catalog/model/product'

import { SearchDrawerCategoryLinks } from './search-drawer-category-links'
import { SearchPopularSearches } from './search-popular-searches'
import { SearchSuggestedItems } from './search-suggested-items'

type SearchSuggestionsPanelProps = {
  categories: CategoryNavigationItem[]
  failed: boolean
  loading: boolean
  onNavigateToSearchResults: (query: string) => void
  onRetry: () => void
  onSelect: () => void
  open: boolean
  products: ProductSummary[]
}

export function SearchSuggestionsPanel({
  categories,
  failed,
  loading,
  onNavigateToSearchResults,
  onRetry,
  onSelect,
  open,
  products,
}: SearchSuggestionsPanelProps) {
  return (
    <div className="space-y-9">
      <SearchPopularSearches
        onNavigateToSearchResults={onNavigateToSearchResults}
      />
      <SearchSuggestedItems
        failed={failed}
        loading={loading}
        onRetry={onRetry}
        onSelect={onSelect}
        open={open}
        products={products}
      />
      <SearchDrawerCategoryLinks categories={categories} onSelect={onSelect} />
    </div>
  )
}
