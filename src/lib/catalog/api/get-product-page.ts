import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/market/model/market'
import { reportError } from '@/lib/observability/report-error'
import { getProductReviewsOverview } from '@/lib/reviews/api/product-reviews.functions'
import type { ProductReviewsFeatureState } from '@/lib/reviews/model/product-review'

import type { ProductPageModel } from '../model/product-page'
import type { Product, ProductSummary } from '../model/product'
import { getProductDetail } from './get-product-detail'
import { getRelatedProductSummaries } from './get-related-product-summaries'

type ProductPageInput = {
  market: MarketSelectionInput
  slug: string
}

type ProductPageLoaders = {
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

const productPageLoaders: ProductPageLoaders = {
  loadProduct: ({ market, slug }) =>
    getProductDetail({ data: { market, slug } }),
  loadRelatedProducts: ({ categoryId, currentProductId, market }) =>
    getRelatedProductSummaries({
      data: { categoryId, currentProductId, market },
    }),
  loadReviews: ({ market, productId }) =>
    getProductReviewsOverview({ data: { market, productId } }),
  reportError,
}

export async function loadProductPage(
  input: ProductPageInput,
  loaders: ProductPageLoaders = productPageLoaders,
): Promise<ProductPageModel> {
  const productPromise = loaders.loadProduct(input)
  const reviewsPromise = loaders.loadReviews({
    market: input.market,
    productId: input.slug,
  })
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

export const getProductPage = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as ProductPageInput)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        market: marketInputSchema,
        slug: z.string().trim().min(1),
      })
      .parse(data)

    return loadProductPage(input)
  })
