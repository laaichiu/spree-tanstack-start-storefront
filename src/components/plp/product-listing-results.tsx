import { ProductListingEmptyState } from '@/components/plp/product-listing-empty-state'
import { ProductListingErrorState } from '@/components/plp/product-listing-error-state'
import { ProductSummaryGrid } from '@/components/plp/product-summary-grid'
import type { ProductListingPageModel } from '@/lib/catalog/model/product-listing-page'

export function ProductListingResults({
  page,
}: {
  page: ProductListingPageModel
}) {
  if (page.status === 'error') {
    return <ProductListingErrorState />
  }

  if (page.products.length === 0) {
    return <ProductListingEmptyState query={page.search.q} />
  }

  return <ProductSummaryGrid products={page.products} />
}
