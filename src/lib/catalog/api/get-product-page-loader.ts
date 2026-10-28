import type {
  Product,
  ProductPageModel as CoreProductPageModel,
  ProductSummary,
} from '@/lib/catalog/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'
import type { reportError } from '@/lib/observability/report-error'

export type ProductPageInput = {
  market: MarketSelectionInput
  slug: string
}

export type ProductPageLoaders = {
  loadProduct: (input: ProductPageInput) => Promise<Product>
  loadRelatedProducts: (input: {
    categoryId: string
    currentProductId: string
    market: MarketSelectionInput
  }) => Promise<ProductSummary[]>
  loadReviews: (input: {
    market: MarketSelectionInput
    productId: string
  }) => Promise<ProductReviewsFeatureState | null>
  reportError: typeof reportError
}

type ProductPageModel = CoreProductPageModel<ProductReviewsFeatureState>

export async function loadProductPage(
  input: ProductPageInput,
  loaders: ProductPageLoaders,
): Promise<ProductPageModel> {
  const productPromise = loaders.loadProduct(input)
  const reviewsPromise = productPromise.then((product) =>
    loaders.loadReviews({
      market: input.market,
      productId: product.id,
    }),
  )
  const relatedProductsPromise = productPromise.then(async (product) => {
    const categoryId = product.categoryBreadcrumbs.at(-1)?.id

    if (!categoryId) {
      return []
    }

    try {
      return await loaders.loadRelatedProducts({
        categoryId,
        currentProductId: product.id,
        market: input.market,
      })
    } catch (error) {
      loaders.reportError({
        context: 'products.detail.relatedProducts',
        error,
      })

      return []
    }
  })
  const [product, relatedProducts, reviews] = await Promise.all([
    productPromise,
    relatedProductsPromise,
    reviewsPromise,
  ])

  return {
    product,
    relatedProducts,
    reviews,
  }
}
