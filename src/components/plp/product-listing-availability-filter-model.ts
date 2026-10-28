import type {
  ProductListingAvailability,
  ProductListingAvailabilityFilter,
} from '@/lib/catalog/contracts'
import type { ProductListingFilterChoiceDisplay } from './product-listing-filter-types'

export function getProductListingAvailabilityFilterChoiceDisplays({
  allLabel,
  filter,
  labels,
  selectedAvailability,
}: {
  allLabel: string
  filter: ProductListingAvailabilityFilter
  labels: {
    inStock: string
    outOfStock: string
  }
  selectedAvailability?: ProductListingAvailability
}): ProductListingFilterChoiceDisplay[] {
  return [
    {
      id: 'any-availability',
      label: allLabel,
      selected: selectedAvailability === undefined,
    },
    ...filter.options.map((option) => ({
      count: option.count,
      id: option.id,
      label: getProductListingAvailabilityLabel(option.id, labels),
      selected: option.id === selectedAvailability,
    })),
  ]
}

export function getProductListingAvailabilityLabel(
  availability: ProductListingAvailability,
  labels: { inStock: string; outOfStock: string },
) {
  return availability === 'in_stock' ? labels.inStock : labels.outOfStock
}
