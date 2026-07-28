import { useMarket } from '@/components/layout/market-provider'
import { formatNumber } from '@/lib/i18n/messages'
import type { ProductReviewSummary } from '@/lib/reviews/model/product-review'

import { formatReviewRating, ReviewStars } from './review-stars'

export const PRODUCT_REVIEWS_SECTION_ID = 'product-reviews'

export function ProductRatingAnchor({
  summary,
}: {
  summary: ProductReviewSummary
}) {
  const { market, t } = useMarket()
  const hasReviews = summary.reviewCount > 0
  const countLabel = hasReviews
    ? `${formatNumber(summary.reviewCount, market.locale)} ${
        summary.reviewCount === 1
          ? t('reviews.reviewSingular')
          : t('reviews.reviewPlural')
      }`
    : t('reviews.noReviews')

  return (
    <a
      aria-label={
        hasReviews ? t('reviews.readReviews') : t('reviews.goToReviews')
      }
      className="mt-5 inline-flex flex-wrap items-center gap-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
      href={`#${PRODUCT_REVIEWS_SECTION_ID}`}
    >
      <ReviewStars
        label={`${formatReviewRating(summary.averageRating)} / 5`}
        rating={summary.averageRating}
      />
      <span className="text-sm leading-6">
        {hasReviews
          ? `${formatReviewRating(summary.averageRating)} (${countLabel})`
          : countLabel}
      </span>
    </a>
  )
}
