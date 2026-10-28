import type { ProductSummary } from '@/lib/catalog/contracts'
import { SearchSuggestedItemsView } from '@/components/layout/search-suggested-items-view'
import { useSearchSuggestedItemsController } from '@/components/layout/use-search-suggested-items-controller'

import { SearchFeaturedProductCard } from './search-drawer-product-card'

type SearchSuggestedItemsProps = {
  failed: boolean
  loading: boolean
  onRetry: () => void
  onSelect: () => void
  open: boolean
  products: ProductSummary[]
}

export function SearchSuggestedItems({
  failed,
  loading,
  onRetry,
  onSelect,
  open,
  products,
}: SearchSuggestedItemsProps) {
  const { actions, model } = useSearchSuggestedItemsController({
    failed,
    loading,
    onRetry,
    open,
    products,
  })

  return (
    <SearchSuggestedItemsView
      actions={actions}
      model={model}
      productCards={products.map((product) => (
        <SearchFeaturedProductCard
          key={product.id}
          onSelect={onSelect}
          product={product}
        />
      ))}
    />
  )
}
