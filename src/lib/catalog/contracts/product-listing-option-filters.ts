import type {
  ProductListingOptionFilter,
  ProductListingSearch,
} from './product-listing'

export function getActiveFilterCount(search: ProductListingSearch): number {
  return (
    search.option.length +
    (search.availability ? 1 : 0) +
    (search.price_min !== undefined || search.price_max !== undefined ? 1 : 0)
  )
}

export function getFilterSelectionCount(
  filter: ProductListingOptionFilter,
  selectedOptionIds: string[],
) {
  return filter.options.filter((option) =>
    selectedOptionIds.includes(option.id),
  ).length
}
