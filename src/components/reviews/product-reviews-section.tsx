import { useMarket } from '@/components/layout/market-provider'
import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'
import { PRODUCT_REVIEWS_SECTION_ID } from './product-reviews-target-ids'
import {
  ProductReviewsEmptyStateView,
  ProductReviewsUnavailableStateView,
} from './product-review-entry-states-view'

import { ProductReviewsReadySection } from './product-reviews-ready-section'

export function ProductReviewsSection({
  feature,
  productId,
}: {
  feature: ProductReviewsFeatureState
  productId: string
}) {
  const { market, t } = useMarket()

  if (feature.status === 'unavailable') {
    return (
      <ProductReviewsUnavailableStateView
        model={{
          description: t('reviews.reviewsUnavailableDescription'),
          sectionId: PRODUCT_REVIEWS_SECTION_ID,
          title: t('reviews.reviewsUnavailable'),
        }}
      />
    )
  }

  if (feature.summary.reviewCount === 0) {
    return (
      <ProductReviewsEmptyStateView
        model={{
          message: t('reviews.noReviews'),
          sectionId: PRODUCT_REVIEWS_SECTION_ID,
          title: t('reviews.title'),
        }}
      />
    )
  }

  return (
    <ProductReviewsReadySection
      feature={feature}
      key={`${market.country}:${market.locale}:${productId}`}
      productId={productId}
    />
  )
}
