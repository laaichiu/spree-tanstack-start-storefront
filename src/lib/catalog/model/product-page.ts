import type { Product, ProductSummary } from './product'
import type { ProductReviewsFeatureState } from '@/lib/reviews/model/product-review'

export type ProductPageModel = {
  product: Product
  relatedProducts: ProductSummary[]
  reviews: ProductReviewsFeatureState | null
}
