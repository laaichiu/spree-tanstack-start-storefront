import { ProductListingController } from '@/components/plp/product-listing-controller'
import { ProductListingReferenceView } from '@/components/plp/product-listing-reference-view'
import type { ProductListingPageModel } from '@/lib/catalog/model/product-listing-page'
import type { ProductListingSearch } from '@/lib/catalog/model/product-listing'

type ProductListingPageProps = {
  onApply: (search: ProductListingSearch) => void
  page: ProductListingPageModel
}

export function ProductListingPage({ onApply, page }: ProductListingPageProps) {
  return (
    <ProductListingController onApply={onApply} page={page}>
      {(controller) => <ProductListingReferenceView controller={controller} />}
    </ProductListingController>
  )
}
