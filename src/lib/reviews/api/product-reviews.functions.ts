import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/market/model/market'
import { reportError } from '@/lib/observability/report-error'

import { isReviewsFeatureEnabled } from '../config/reviews-config.server'
import {
  mapProductReviewFilters,
  mapProductReviewsPage,
  mapProductReviewSummary,
} from '../mappers/product-review.mapper'
import type {
  ProductReviewQuery,
  ProductReviewsFeatureState,
  ProductReviewsPage,
  ProductReviewSort,
} from '../model/product-review'
import { PRODUCT_REVIEWS_PAGE_SIZE } from '../model/product-review'
import {
  productReviewsPath,
  resolveReviewsRequestContext,
} from './reviews-request.server'

type ReviewsBaseInput = {
  market: MarketSelectionInput
  productId: string
}

type ProductReviewsPageInput = ReviewsBaseInput & {
  query: ProductReviewQuery
}

const REVIEW_SORTS = [
  'most_recent',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
] as const satisfies readonly ProductReviewSort[]

async function parseBaseInput(data: ReviewsBaseInput) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      market: marketInputSchema,
      productId: z.string().trim().min(1),
    })
    .parse(data)
}

async function parsePageInput(data: ProductReviewsPageInput) {
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

function toReviewsParams(query: ProductReviewQuery) {
  const params: Record<string, boolean | number | string> = {
    limit: PRODUCT_REVIEWS_PAGE_SIZE,
    page: query.page,
    sort: query.sort,
  }

  if (query.ratings.length) {
    params.rating = query.ratings.join(',')
  }

  if (query.withImages) {
    params.with_images = true
  }

  if (query.verifiedPurchase) {
    params.verified_purchase = true
  }

  for (const [questionKey, values] of Object.entries(query.answerFilters)) {
    if (!values) {
      continue
    }

    const normalizedValues = values.map((value) => value.trim()).filter(Boolean)

    if (normalizedValues.length) {
      params[`answers[${questionKey}]`] = normalizedValues.join(',')
    }
  }

  return params
}

export const getReviewsFeatureStatus = createServerFn({
  method: 'GET',
}).handler(() => ({ enabled: isReviewsFeatureEnabled() }))

export const getProductReviewsOverview = createServerFn({ method: 'GET' })
  .validator((data: ReviewsBaseInput) => data)
  .handler(async ({ data }): Promise<ProductReviewsFeatureState | null> => {
    if (!isReviewsFeatureEnabled()) {
      return null
    }

    try {
      const input = await parseBaseInput(data)
      const context = await resolveReviewsRequestContext(input.market)

      if (!context) {
        return null
      }

      // The installed SDK has no reviews resource. Its low-level request API
      // preserves the configured Store API auth, market headers, and retries.
      const [summary, reviews, filters] = await Promise.all([
        context.client.request<unknown>(
          'GET',
          productReviewsPath(input.productId, '/summary'),
        ),
        context.client.request<unknown>(
          'GET',
          productReviewsPath(input.productId),
          {
            params: {
              limit: PRODUCT_REVIEWS_PAGE_SIZE,
              page: 1,
              sort: 'most_recent',
            },
          },
        ),
        context.client.request<unknown>(
          'GET',
          productReviewsPath(input.productId, '/filters'),
        ),
      ])

      return {
        filters: mapProductReviewFilters(filters),
        initialPage: mapProductReviewsPage(reviews),
        status: 'ready',
        summary: mapProductReviewSummary(summary, input.productId),
      }
    } catch (error) {
      reportError({
        context: 'reviews.product.overview',
        error,
      })

      return { status: 'unavailable' }
    }
  })

export const getProductReviewsPage = createServerFn({ method: 'GET' })
  .validator((data: ProductReviewsPageInput) => data)
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
        { params: toReviewsParams(input.query) },
      )

      return mapProductReviewsPage(response)
    } catch (error) {
      reportError({
        context: 'reviews.product.page',
        error,
      })

      throw error
    }
  })
