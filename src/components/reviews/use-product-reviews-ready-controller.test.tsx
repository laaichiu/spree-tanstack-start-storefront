import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProductReview, ProductReviewsPage } from '@/lib/reviews/contracts'
import { PRODUCT_REVIEWS_SUMMARY_ID } from './product-reviews-target-ids'

import { useProductReviewsReadyController } from './use-product-reviews-ready-controller'

const state = vi.hoisted(() => ({
  page: undefined as ProductReviewsPage | undefined,
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: {
      country: 'us',
      currencyCode: 'USD',
      locale: 'en',
      marketId: 'market-us',
      marketName: 'United States',
    },
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/reviews/client/use-product-reviews', () => ({
  useProductReviewVote: () => ({
    hasErrorForReview: () => false,
    isPendingForReview: () => false,
    submitVote: vi.fn(),
  }),
  useProductReviews: () => ({
    data: state.page,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}))

const review = {
  answers: [],
  body: 'Review body',
  createdAt: '2026-08-27T00:00:00.000Z',
  currentVote: null,
  helpfulCount: 0,
  id: 'rev_review',
  media: [
    {
      alt: 'Customer photo',
      id: 'rmedia_photo',
      position: 0,
      url: 'https://example.com/photo.jpg',
    },
  ],
  notHelpfulCount: 0,
  productId: 'prod_product',
  purchasedOptionValues: [],
  rating: 5,
  reviewerName: null,
  title: 'Review title',
  variantId: null,
  verifiedPurchase: false,
} satisfies ProductReview

const initialPage = {
  pagination: {
    count: 1,
    limit: 10,
    nextPage: null,
    page: 1,
    pageCount: 1,
    previousPage: null,
  },
  reviews: [review],
} satisfies ProductReviewsPage

const feature = {
  filters: {
    defaultSort: 'most_recent' as const,
    filters: [],
    sortOptions: [],
  },
  initialPage,
  status: 'ready' as const,
  summary: {
    averageRating: 5,
    productId: 'prod_product',
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    reviewCount: 1,
  },
}

afterEach(() => {
  cleanup()
  document.getElementById(PRODUCT_REVIEWS_SUMMARY_ID)?.remove()
  state.page = undefined
  vi.clearAllMocks()
})

describe('useProductReviewsReadyController', () => {
  it('scrolls to the rating summary when changing pages and closes its photo', () => {
    const summary = document.createElement('div')
    const scrollIntoView = vi.fn()
    summary.id = PRODUCT_REVIEWS_SUMMARY_ID
    summary.scrollIntoView = scrollIntoView
    document.body.append(summary)

    const { result } = renderHook(() =>
      useProductReviewsReadyController({ feature, productId: 'prod_product' }),
    )

    act(() => result.current.media.onSelectId('rev_review:rmedia_photo'))
    act(() => result.current.pagination.goToPage(3))

    expect(result.current.controls.query.page).toBe(3)
    expect(result.current.media.selectedId).toBeNull()
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('closes and clears a selected media item removed by a page update', async () => {
    const { result, rerender } = renderHook(() =>
      useProductReviewsReadyController({
        feature,
        productId: 'prod_product',
      }),
    )

    act(() => {
      result.current.media.onSelectId('rev_review:rmedia_photo')
    })
    expect(result.current.media.selectedId).toBe('rev_review:rmedia_photo')

    state.page = {
      ...initialPage,
      reviews: [],
    }
    rerender()

    await waitFor(() => expect(result.current.media.selectedId).toBeNull())
  })

  it('clears selected media when filters are cleared', () => {
    const { result } = renderHook(() =>
      useProductReviewsReadyController({
        feature,
        productId: 'prod_product',
      }),
    )

    act(() => {
      result.current.controls.onChange({
        ...result.current.controls.query,
        withImages: true,
      })
    })
    act(() => {
      result.current.media.onSelectId('rev_review:rmedia_photo')
    })

    expect(result.current.media.selectedId).toBe('rev_review:rmedia_photo')

    act(() => {
      result.current.controls.onClear()
    })

    expect(result.current.media.selectedId).toBeNull()
  })
})
