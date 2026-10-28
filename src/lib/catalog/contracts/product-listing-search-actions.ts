import type {
  ProductListingAvailability,
  ProductListingFilters,
  ProductListingSearch,
} from './product-listing'
import { getProductListingFilterGroups } from './product-listing-filter-groups'

export type ProductListingSearchAction =
  | { type: 'clear-filters' }
  | { optionId: string; type: 'remove-option' }
  | {
      availability?: ProductListingAvailability
      type: 'set-availability'
    }
  | { max?: number; min?: number; type: 'set-price' }
  | { optionId: string; type: 'toggle-option' }

/**
 * Applies filter-only changes without changing the current page.
 *
 * Page reset and URL navigation remain runtime responsibilities because they
 * depend on the current route and its search adapter.
 */
export function updateProductListingSearch(
  search: ProductListingSearch,
  action: ProductListingSearchAction,
): ProductListingSearch {
  switch (action.type) {
    case 'clear-filters':
      return {
        ...search,
        availability: undefined,
        option: [],
        price_max: undefined,
        price_min: undefined,
      }
    case 'remove-option':
      return {
        ...search,
        option: search.option.filter(
          (optionId) => optionId !== action.optionId,
        ),
      }
    case 'set-availability':
      return {
        ...search,
        availability: action.availability,
      }
    case 'set-price':
      return {
        ...search,
        price_max: action.max,
        price_min: action.min,
      }
    case 'toggle-option': {
      const optionSet = new Set(search.option)

      if (optionSet.has(action.optionId)) {
        optionSet.delete(action.optionId)
      } else {
        optionSet.add(action.optionId)
      }

      return {
        ...search,
        option: [...optionSet],
      }
    }
  }
}

export function resetProductListingSearchPage(
  search: ProductListingSearch,
): ProductListingSearch {
  return { ...search, page: 1 }
}

export function getProductListingFilterSectionIds(
  filters: ProductListingFilters | null | undefined,
): string[] {
  const { availabilityFilter, optionFilters, priceFilter } =
    getProductListingFilterGroups(filters)
  const sectionIds = optionFilters.map((filter) => filter.id)

  if (priceFilter) {
    sectionIds.push('price')
  }

  if (availabilityFilter) {
    sectionIds.push('availability')
  }

  return sectionIds
}
