import { ProductDetailController } from '@/components/pdp/product-detail-controller'
import { ProductDetailReferenceView } from '@/components/pdp/product-detail-reference-view'
import type { ProductPageModel } from '@/lib/catalog/model/product-page'

type ProductDetailProps = {
  page: ProductPageModel
}

export function ProductDetail({ page }: ProductDetailProps) {
  return (
    <ProductDetailController page={page}>
      {(controller) => <ProductDetailReferenceView controller={controller} />}
    </ProductDetailController>
  )
}
