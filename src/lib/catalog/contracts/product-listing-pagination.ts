import type { ProductListingPageModel } from './product-listing-page'

export type ProductListingPagination = {
  canGoNext: boolean
  canGoPrevious: boolean
  currentPage: number
  from: number
  hasResults: boolean
  to: number
  totalCount: number
  totalPages: number
}

/**
 * Resolves pagination semantics from a normalized listing page.
 *
 * Formatting labels and URL/search mutations remain outside Core; this
 * selector only owns the API-meta fallbacks and page boundaries.
 */
export function getProductListingPagination(
  page: Pick<
    ProductListingPageModel,
    'meta' | 'products' | 'search' | 'status'
  >,
): ProductListingPagination {
  const totalCount = page.meta?.count ?? page.products.length
  const currentPage = page.meta?.page ?? page.search.page
  const totalPages = Math.max(1, page.meta?.pages ?? 1)

  return {
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
    currentPage,
    from: page.meta?.from ?? (page.products.length > 0 ? 1 : 0),
    hasResults: page.status === 'ready' && totalCount > 0,
    to: page.meta?.to ?? page.products.length,
    totalCount,
    totalPages,
  }
}
