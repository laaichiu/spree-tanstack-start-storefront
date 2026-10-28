import type {
  ProductListingAvailabilityFilter,
  ProductListingFilters,
  ProductListingOptionFilter,
  ProductListingPriceRangeFilter,
} from './product-listing'

export type ProductListingFilterGroups = {
  availabilityFilter: ProductListingAvailabilityFilter | null
  optionFilters: ProductListingOptionFilter[]
  priceFilter: ProductListingPriceRangeFilter | null
}

export function getProductListingFilterGroups(
  filters: ProductListingFilters | null | undefined,
): ProductListingFilterGroups {
  const availableFilters = filters?.filters ?? []

  return {
    availabilityFilter:
      availableFilters.find((filter) => filter.type === 'availability') ?? null,
    optionFilters: availableFilters.filter(
      (filter): filter is ProductListingOptionFilter =>
        filter.type === 'option',
    ),
    priceFilter:
      availableFilters.find((filter) => filter.type === 'price_range') ?? null,
  }
}
