import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  DEFAULT_PRODUCT_LISTING_SORT,
} from './product-listing'
import type { ProductListingSearch } from './product-listing'

export function buildListingCanonicalPath(
  basePath: string,
  search: ProductListingSearch,
) {
  return search.page > 1 ? `${basePath}?page=${search.page}` : basePath
}

export function shouldNoIndexProductListing(search: ProductListingSearch) {
  return Boolean(
    search.q ||
    search.option.length > 0 ||
    search.availability ||
    search.price_min !== undefined ||
    search.price_max !== undefined ||
    search.limit !== DEFAULT_PRODUCT_LISTING_SEARCH.limit ||
    search.sort !== DEFAULT_PRODUCT_LISTING_SORT,
  )
}
