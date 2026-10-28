import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  parseProductListingSearch,
} from '@/lib/catalog/contracts'
import type { ProductListingSearch } from '@/lib/catalog/contracts'

/**
 * Brand catalogs use the same URL search contract as collection catalogs.
 * The brand route adds the backend Seller predicate; it must not fork the
 * storefront's filter, sort, or pagination vocabulary.
 */
export const DEFAULT_BRAND_SEARCH = DEFAULT_PRODUCT_LISTING_SEARCH

export type BrandSearch = ProductListingSearch

export const parseBrandSearch = parseProductListingSearch
