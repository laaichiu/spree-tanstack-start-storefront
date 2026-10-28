import { createServerFn } from '@tanstack/react-start'

import type {
  ProductReviewsFeatureState,
  ProductReviewsPage,
  ProductReviewSort,
} from '@/lib/reviews/contracts'
import { reportError } from '@/lib/observability/report-error'

import { isReviewsFeatureEnabled } from '../config/reviews-config.server'
import { mapProductReviewsPage } from '../mappers/product-review.mapper'
import {
  productReviewsPath,
  resolveReviewsRequestContext,
} from './reviews-request.server'
import { toProductReviewQueryParams } from '../utils/review-query-params'
import { isReviewProductResourceId } from '../utils/review-product-identity'

const REVIEW_SORTS = [
  'most_recent',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
] as const satisfies readonly ProductReviewSort[]

function assertReviewsBelongToProduct(
  page: ProductReviewsPage,
  productId: string,
) {
  if (
    page.reviews.every(
      (review) =>
        isReviewProductResourceId(review.productId) &&
        (!isReviewProductResourceId(productId) ||
          review.productId === productId),
    )
  ) {
    return
  }

  throw new Error('The product reviews response does not match the request.')
}

async function parseBaseInput(data: unknown) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      market: marketInputSchema,
      productId: z.string().trim().min(1),
    })
    .parse(data)
}

async function parsePageInput(data: unknown) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      market: marketInputSchema,
      productId: z.string().trim().min(1),
      query: z.object({
        answerFilters: z.record(z.string(), z.array(z.string())).default({}),
        page: z.number().int().positive(),
        ratings: z.array(z.string()).default([]),
        sort: z.enum(REVIEW_SORTS),
        verifiedPurchase: z.boolean(),
        withImages: z.boolean(),
      }),
    })
    .parse(data)
}

export const getReviewsFeatureStatus = createServerFn({
  method: 'GET',
}).handler(() => ({ enabled: isReviewsFeatureEnabled() }))

export const getReviewsFeatureEnabledSafely = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    return (await getReviewsFeatureStatus()).enabled
  } catch {
    return false
  }
})

export const getProductReviewsOverview = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ProductReviewsFeatureState | null> => {
    const input = await parseBaseInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      return null
    }

    const { getProductReviewsOverviewForMarket } =
      await import('./product-reviews-overview.server')

    return getProductReviewsOverviewForMarket({
      client: context.client,
      market: context.market,
      productId: input.productId,
    })
  })

export const getProductReviewsPage = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ProductReviewsPage | null> => {
    if (!isReviewsFeatureEnabled()) {
      return null
    }

    const input = await parsePageInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      return null
    }

    try {
      const response = await context.client.request<unknown>(
        'GET',
        productReviewsPath(input.productId),
        { params: toProductReviewQueryParams(input.query) },
      )
      const page = mapProductReviewsPage(response)
      assertReviewsBelongToProduct(page, input.productId)

      return page
    } catch (error) {
      reportError({
        context: 'reviews.product.page',
        error,
      })

      throw error
    }
  })
