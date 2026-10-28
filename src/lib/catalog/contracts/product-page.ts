import type { Product, ProductSummary } from './product'

/**
 * The serializable PDP contract shared by the catalog runtime and page views.
 *
 * Review data stays generic here so an optional storefront feature can extend
 * the page without making the framework-independent core depend on its API.
 */
export type ProductPageModel<TReviews = unknown> = {
  product: Product
  relatedProducts: ProductSummary[]
  reviews: TReviews | null
}
