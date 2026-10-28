import type { ReactNode } from 'react'
import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'

import { ProductReviewCard } from './product-review-card'
import { ProductReviewControls } from './product-review-controls'
import { ProductReviewSummaryPanel } from './product-review-summary'
import { PRODUCT_REVIEWS_SECTION_ID } from './product-reviews-section-id'
import { ReviewMediaLightbox } from './review-media-lightbox'
import {
  ProductReviewsListView,
  ProductReviewsPaginationView,
  ProductReviewsReadySectionView,
} from './product-review-ready-section-view'
import {
  ProductReviewsLoadErrorStateView,
  ProductReviewsNoResultsStateView,
} from './product-review-entry-states-view'
import { useProductReviewsReadyController } from './use-product-reviews-ready-controller'

export function ProductReviewsReadySection({
  feature,
  productId,
}: {
  feature: Extract<ProductReviewsFeatureState, { status: 'ready' }>
  productId: string
}) {
  const { controls, media, page, pagination, reviews, summary, t, vote } =
    useProductReviewsReadyController({ feature, productId })

  let reviewContent: ReactNode

  if (reviews.failed) {
    reviewContent = (
      <ProductReviewsLoadErrorStateView
        model={{
          description: t('reviews.loadFailedDescription'),
          retryLabel: t('reviews.loading'),
          title: t('reviews.loadFailed'),
        }}
        onRetry={() => void reviews.refetch()}
      />
    )
  } else if (page.reviews.length > 0) {
    reviewContent = (
      <ProductReviewsListView>
        {page.reviews.map((review) => (
          <ProductReviewCard
            failedVote={vote.hasErrorForReview(review.id)}
            key={review.id}
            onMediaClick={media.onSelectId}
            onVote={(nextVote) => vote.submit(review.id, nextVote)}
            pendingVote={vote.isPendingForReview(review.id)}
            review={review}
          />
        ))}
      </ProductReviewsListView>
    )
  } else {
    reviewContent = (
      <ProductReviewsNoResultsStateView
        model={{
          description: t('reviews.noReviewsDescription'),
          title: t('reviews.noReviews'),
        }}
      />
    )
  }

  const paginationSlot = pagination.visible ? (
    <ProductReviewsPaginationView
      actions={{
        next: pagination.next,
        previous: pagination.previous,
      }}
      model={pagination.model}
    />
  ) : null

  return (
    <ProductReviewsReadySectionView
      model={{
        isFetching: reviews.fetching,
        loadingLabel: t('reviews.loading'),
        sectionId: PRODUCT_REVIEWS_SECTION_ID,
        title: t('reviews.title'),
      }}
      slots={{
        content: reviewContent,
        controls: <ProductReviewControls {...controls} />,
        mediaLightbox: (
          <ReviewMediaLightbox
            items={media.items}
            selectedId={media.selectedId}
            onClose={media.onClose}
            onSelectId={media.onSelectId}
          />
        ),
        pagination: paginationSlot,
        summary: <ProductReviewSummaryPanel summary={summary} />,
      }}
    />
  )
}
