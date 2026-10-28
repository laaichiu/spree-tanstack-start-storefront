import '@tanstack/react-start/server-only'

import type { ProductPageModel as CoreProductPageModel } from '@/lib/catalog/contracts'
import type { ResolvedMarket } from '@/lib/core/market'
import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'
import { reportError } from '@/lib/observability/report-error'

import { getProductDetailForMarket } from './get-product-detail.server'
import { loadProductPage } from './get-product-page-loader'
import type { ProductPageLoaders } from './get-product-page-loader'
import { getRelatedProductSummariesForMarket } from './get-related-product-summaries.server'
import { getProductReviewsOverviewForMarket } from '@/lib/reviews/api/product-reviews-overview.server'

type ProductPageModel = CoreProductPageModel<ProductReviewsFeatureState>

export async function loadProductPageForMarket({
  market,
  slug,
}: {
  market: ResolvedMarket
  slug: string
}): Promise<ProductPageModel> {
  const loaders: ProductPageLoaders = {
    loadProduct: () => getProductDetailForMarket({ market, slug }),
    loadRelatedProducts: ({ categoryId, currentProductId }) =>
      getRelatedProductSummariesForMarket({
        categoryId,
        currentProductId,
        market,
      }),
    loadReviews: ({ productId }) =>
      getProductReviewsOverviewForMarket({ market, productId }),
    reportError,
  }

  return loadProductPage({ market, slug }, loaders)
}
