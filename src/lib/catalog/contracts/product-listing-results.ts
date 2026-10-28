import type { ProductListingPageModel } from './product-listing-page'

export type ProductListingResultsState = 'empty' | 'error' | 'ready'

export function getProductListingResultsState(page: {
  products: readonly unknown[]
  status: ProductListingPageModel['status']
}): ProductListingResultsState {
  if (page.status === 'error') {
    return 'error'
  }

  return page.products.length === 0 ? 'empty' : 'ready'
}
