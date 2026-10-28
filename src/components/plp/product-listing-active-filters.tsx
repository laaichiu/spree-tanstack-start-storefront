import { getProductListingActiveFiltersDisplay } from './product-listing-active-filter-model'

import type {
  ProductListingOptionFilter,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import type { ProductListingPriceBucketDisplay } from './product-listing-price-filter-model'
import type { MessageKey } from '@/lib/i18n/messages'
import { ProductListingActiveFiltersView } from './product-listing-active-filters-view'

type ProductListingActiveFiltersProps = {
  appliedPriceBucket?: ProductListingPriceBucketDisplay
  optionFilters: ProductListingOptionFilter[]
  onClearAll: () => void
  onRemoveAvailability: () => void
  onRemoveOption: (optionId: string) => void
  onRemovePrice: () => void
  search: ProductListingSearch
  t: (key: MessageKey) => string
}

export function ProductListingActiveFilters({
  appliedPriceBucket,
  optionFilters,
  onClearAll,
  onRemoveAvailability,
  onRemoveOption,
  onRemovePrice,
  search,
  t,
}: ProductListingActiveFiltersProps) {
  const display = getProductListingActiveFiltersDisplay({
    appliedPriceBucket,
    labels: {
      availability: t('product.availability'),
      inStock: t('product.inStock'),
      outOfStock: t('product.outOfStock'),
    },
    optionFilters,
    search,
  })
  return (
    <ProductListingActiveFiltersView
      actions={{
        clearAll: onClearAll,
        removeAvailability: onRemoveAvailability,
        removeOption: onRemoveOption,
        removePrice: onRemovePrice,
      }}
      availabilityChip={display.availability}
      clearAllLabel={t('product.clearAll')}
      optionChips={display.options}
      priceChip={display.price}
    />
  )
}
