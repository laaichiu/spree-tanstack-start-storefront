import type { ProductReviewSummary } from '@/lib/reviews/contracts'
import { formatNumber } from '@/components/shared/locale-format'
import { formatReviewRating } from './review-rating-display'
import { getReviewSummaryBars } from './product-review-summary-bars'

export type ProductReviewSummaryDisplay = {
  averageRating: number
  ratingBars: Array<{
    countLabel: string
    rating: number
    widthPercent: number
  }>
  ratingLabel: string
  overallRatingLabel: string
  reviewCountLabel: string
}

export function getProductReviewSummaryDisplay({
  labels,
  locale,
  summary,
}: {
  labels: {
    overallRating: string
    reviewPlural: string
    reviewSingular: string
  }
  locale: string
  summary: ProductReviewSummary
}): ProductReviewSummaryDisplay {
  const ratingLabel = formatReviewRating(summary.averageRating)

  return {
    averageRating: summary.averageRating,
    overallRatingLabel: `${ratingLabel} ${labels.overallRating}`,
    ratingBars: getReviewSummaryBars(summary).map(
      ({ count, rating, widthPercent }) => ({
        countLabel: formatNumber(count, locale),
        rating,
        widthPercent,
      }),
    ),
    ratingLabel: `${ratingLabel} / 5`,
    reviewCountLabel: `${formatNumber(summary.reviewCount, locale)} ${
      summary.reviewCount === 1 ? labels.reviewSingular : labels.reviewPlural
    }`,
  }
}
