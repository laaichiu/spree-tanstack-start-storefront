import type {
  ProductListingOptionFilter,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import { getProductListingActiveOptionDisplays } from './product-listing-option-filter-display'
import { getProductListingAvailabilityLabel } from './product-listing-availability-filter-model'
import type { ProductListingPriceBucketDisplay } from './product-listing-price-filter-model'

export type ProductListingActiveFilterChip = {
  id: string
  label: string
}

export type ProductListingActiveFiltersDisplay = {
  availability: ProductListingActiveFilterChip | null
  options: ProductListingActiveFilterChip[]
  price: ProductListingActiveFilterChip | null
}

export function getProductListingActiveFiltersDisplay({
  appliedPriceBucket,
  labels,
  optionFilters,
  search,
}: {
  appliedPriceBucket?: ProductListingPriceBucketDisplay
  labels: {
    availability: string
    inStock: string
    outOfStock: string
  }
  optionFilters: readonly ProductListingOptionFilter[]
  search: ProductListingSearch
}): ProductListingActiveFiltersDisplay {
  const options = getProductListingActiveOptionDisplays(
    optionFilters,
    search.option,
  ).map((display) => ({
    id: display.optionId,
    label: display.filterLabel
      ? `${display.filterLabel}: ${display.label}`
      : display.label,
  }))
  const availability = search.availability
    ? {
        id: 'availability',
        label: `${labels.availability}: ${getProductListingAvailabilityLabel(
          search.availability,
          labels,
        )}`,
      }
    : null
  const price = appliedPriceBucket
    ? { id: 'price', label: appliedPriceBucket.label }
    : null

  return { availability, options, price }
}
