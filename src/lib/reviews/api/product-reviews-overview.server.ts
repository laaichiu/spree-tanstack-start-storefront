import '@tanstack/react-start/server-only'

import type { Client as SpreeClient } from '@spree/sdk'

import { PRODUCT_REVIEWS_PAGE_SIZE } from '@/lib/reviews/contracts'
import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'
import type { ResolvedMarket } from '@/lib/core/market'
import { reportError } from '@/lib/observability/report-error'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { isReviewsFeatureEnabled } from '../config/reviews-config.server'
import {
  mapProductReviewFilters,
  mapProductReviewsPage,
  mapProductReviewSummary,
} from '../mappers/product-review.mapper'
import { productReviewsPath } from './reviews-request.server'
import {
  assertReviewsBelongToProduct,
  assertReviewProductResourceMatchesRequestedLocator,
} from '../utils/review-product-identity'

export async function getProductReviewsOverviewForMarket({
  client: scopedClient,
  market,
  productId,
}: {
  client?: SpreeClient
  market: ResolvedMarket
  productId: string
}): Promise<ProductReviewsFeatureState | null> {
  if (!isReviewsFeatureEnabled()) {
    return null
  }

  try {
    const client = scopedClient ?? getServerSpreeClientForMarket(market)
    // The installed SDK has no reviews resource. Its low-level request API
    // preserves the configured Store API auth, market headers, and retries.
    const [summary, reviews, filters] = await Promise.all([
      client.request<unknown>('GET', productReviewsPath(productId, '/summary')),
      client.request<unknown>('GET', productReviewsPath(productId), {
        params: {
          limit: PRODUCT_REVIEWS_PAGE_SIZE,
          page: 1,
          sort: 'most_recent',
        },
      }),
      client.request<unknown>('GET', productReviewsPath(productId, '/filters')),
    ])

    const initialPage = mapProductReviewsPage(reviews)
    const reviewSummary = mapProductReviewSummary(summary)

    assertReviewsBelongToProduct(initialPage.reviews, productId)
    assertReviewProductResourceMatchesRequestedLocator(reviewSummary, productId)

    return {
      filters: mapProductReviewFilters(filters),
      initialPage,
      status: 'ready',
      summary: reviewSummary,
    }
  } catch (error) {
    reportError({
      context: 'reviews.product.overview',
      error,
    })

    return { status: 'unavailable' }
  }
}
