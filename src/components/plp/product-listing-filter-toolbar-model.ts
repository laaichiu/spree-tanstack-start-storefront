import {
  getActiveFilterCount,
  getFilterSelectionCount,
} from '@/lib/catalog/contracts'
import type {
  ProductListingAvailabilityFilter,
  ProductListingOptionFilter,
  ProductListingPriceRangeFilter,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/contracts'

export type ProductListingFilterToolbarItem = {
  badgeCount?: number
  id: string
  isActive: boolean
  label: string
}

export type ProductListingFilterToolbarDisplay = {
  appliedFilterCount: number
  filters: ProductListingFilterToolbarItem[]
  hasAppliedFilters: boolean
}

export function getProductListingFilterToolbarDisplay({
  availabilityFilter,
  labels,
  optionFilters,
  priceFilter,
  search,
}: {
  availabilityFilter: ProductListingAvailabilityFilter | null
  labels: {
    availability: string
    price: string
  }
  optionFilters: readonly ProductListingOptionFilter[]
  priceFilter: ProductListingPriceRangeFilter | null
  search: ProductListingSearch
}): ProductListingFilterToolbarDisplay {
  const appliedFilterCount = getActiveFilterCount(search)
  const filters = optionFilters.map((filter) => {
    const selectedCount = getFilterSelectionCount(filter, search.option)

    return {
      badgeCount: selectedCount || undefined,
      id: filter.id,
      isActive: selectedCount > 0,
      label: filter.label,
    }
  })

  if (priceFilter) {
    const isActive =
      search.price_min !== undefined || search.price_max !== undefined

    filters.push({
      badgeCount: isActive ? 1 : undefined,
      id: 'price',
      isActive,
      label: labels.price,
    })
  }

  if (availabilityFilter) {
    const isActive = Boolean(search.availability)

    filters.push({
      badgeCount: isActive ? 1 : undefined,
      id: 'availability',
      isActive,
      label: labels.availability,
    })
  }

  return {
    appliedFilterCount,
    filters,
    hasAppliedFilters: appliedFilterCount > 0,
  }
}

export type ProductListingSortDisplay = {
  label: string
  value: ProductListingSort
}

export function getProductListingSortDisplays(
  sortOptions: readonly ProductListingSort[],
  labels: Readonly<Record<ProductListingSort, string>>,
): ProductListingSortDisplay[] {
  return sortOptions.map((value) => ({
    label: labels[value],
    value,
  }))
}
