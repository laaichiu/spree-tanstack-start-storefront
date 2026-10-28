import { useEffect, useMemo, useState } from 'react'

import type {
  ProductReviewQuery,
  ProductReviewsFeatureState,
  ProductReviewVote,
} from '@/lib/reviews/contracts'
import { getDefaultProductReviewQuery } from '@/lib/reviews/contracts'
import {
  useProductReviewVote,
  useProductReviews,
} from '@/lib/reviews/client/use-product-reviews'

import { useMarket } from '@/components/layout/market-provider'

import { getReviewMediaItems } from './review-media-items'
import { getProductReviewPaginationPresentation } from './product-review-pagination-model'

type ReadyProductReviewsFeature = Extract<
  ProductReviewsFeatureState,
  { status: 'ready' }
>

export function useProductReviewsReadyController({
  feature,
  productId,
}: {
  feature: ReadyProductReviewsFeature
  productId: string
}) {
  const { market, t } = useMarket()
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [query, setQuery] = useState<ProductReviewQuery>(() =>
    getDefaultProductReviewQuery(feature.filters.defaultSort),
  )
  const reviewsQuery = useProductReviews({
    defaultSort: feature.filters.defaultSort,
    initialPage: feature.initialPage,
    market,
    productId,
    query,
  })
  const reviewVote = useProductReviewVote({ market, productId })
  const page = reviewsQuery.data ?? feature.initialPage
  const paginationPresentation = getProductReviewPaginationPresentation({
    disabled: reviewsQuery.isFetching,
    labels: {
      navigation: t('reviews.title'),
      next: t('reviews.nextPage'),
      pageOf: t('reviews.pageOf'),
      previous: t('reviews.previousPage'),
    },
    locale: market.locale,
    pagination: page.pagination,
  })
  const reviewMediaItems = useMemo(
    () => getReviewMediaItems(page.reviews),
    [page.reviews],
  )

  useEffect(() => {
    if (
      selectedMediaId !== null &&
      !reviewMediaItems.some((item) => item.id === selectedMediaId)
    ) {
      setSelectedMediaId(null)
    }
  }, [reviewMediaItems, selectedMediaId])

  function updateQuery(nextQuery: ProductReviewQuery) {
    setSelectedMediaId(null)
    setQuery(nextQuery)
  }

  function updatePage(nextPage: number | null) {
    if (!nextPage) {
      return
    }

    setSelectedMediaId(null)
    setQuery((current) => ({ ...current, page: nextPage }))
  }

  function vote(reviewId: string, nextVote: ProductReviewVote) {
    reviewVote.submitVote({ reviewId, vote: nextVote })
  }

  return {
    controls: {
      disabled: reviewsQuery.isFetching,
      filters: feature.filters,
      onChange: updateQuery,
      onClear: () => {
        setSelectedMediaId(null)
        setQuery((current) => getDefaultProductReviewQuery(current.sort))
      },
      query,
    },
    media: {
      items: reviewMediaItems,
      onClose: () => setSelectedMediaId(null),
      onSelectId: setSelectedMediaId,
      selectedId: selectedMediaId,
    },
    page,
    pagination: {
      model: paginationPresentation,
      next: () => updatePage(page.pagination.nextPage),
      previous: () => updatePage(page.pagination.previousPage),
      visible: page.pagination.pageCount > 1,
    },
    reviews: {
      failed: reviewsQuery.isError,
      fetching: reviewsQuery.isFetching,
      refetch: reviewsQuery.refetch,
    },
    summary: feature.summary,
    t,
    vote: {
      hasErrorForReview: reviewVote.hasErrorForReview,
      isPendingForReview: reviewVote.isPendingForReview,
      submit: vote,
    },
  }
}
