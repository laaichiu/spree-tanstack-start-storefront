import { createServerFn } from '@tanstack/react-start'
import type { Client as SpreeClient } from '@spree/sdk'

import type {
  ProductReview,
  ProductReviewQuery,
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
import { assertReviewsBelongToProduct } from '../utils/review-product-identity'

const REVIEW_SORTS = [
  'most_recent',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
] as const satisfies readonly ProductReviewSort[]
const REVIEW_MEDIA_GALLERY_PAGE_BATCH_SIZE = 4

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

async function fetchProductReviewsPage({
  client,
  productId,
  query,
}: {
  client: SpreeClient
  productId: string
  query: ProductReviewQuery
}) {
  const response = await client.request<unknown>(
    'GET',
    productReviewsPath(productId),
    { params: toProductReviewQueryParams(query) },
  )
  const page = mapProductReviewsPage(response)
  assertReviewsBelongToProduct(page.reviews, productId)

  return page
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
      return await fetchProductReviewsPage({
        client: context.client,
        productId: input.productId,
        query: input.query,
      })
    } catch (error) {
      reportError({
        context: 'reviews.product.page',
        error,
      })

      throw error
    }
  })

export const getProductReviewMediaGallery = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ProductReview[] | null> => {
    if (!isReviewsFeatureEnabled()) {
      return null
    }

    const input = await parsePageInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      return null
    }

    try {
      const galleryQuery = { ...input.query, page: 1, withImages: true }
      const firstPage = await fetchProductReviewsPage({
        client: context.client,
        productId: input.productId,
        query: galleryQuery,
      })
      const reviews = [...firstPage.reviews]
      const remainingPageCount = Math.max(firstPage.pagination.pageCount - 1, 0)

      for (
        let pageOffset = 0;
        pageOffset < remainingPageCount;
        pageOffset += REVIEW_MEDIA_GALLERY_PAGE_BATCH_SIZE
      ) {
        const pageNumbers = Array.from(
          {
            length: Math.min(
              REVIEW_MEDIA_GALLERY_PAGE_BATCH_SIZE,
              remainingPageCount - pageOffset,
            ),
          },
          (_, index) => pageOffset + index + 2,
        )
        const pages = await Promise.all(
          pageNumbers.map((page) =>
            fetchProductReviewsPage({
              client: context.client,
              productId: input.productId,
              query: { ...galleryQuery, page },
            }),
          ),
        )

        reviews.push(...pages.flatMap((page) => page.reviews))
      }

      return reviews
    } catch (error) {
      reportError({
        context: 'reviews.product.media_gallery',
        error,
      })

      throw error
    }
  })
