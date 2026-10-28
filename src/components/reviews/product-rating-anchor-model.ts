import type { ProductReviewSummary } from '@/lib/reviews/contracts'
import { formatNumber } from '@/components/shared/locale-format'
import { formatReviewRating } from './review-rating-display'

export type ProductRatingAnchorCopy = {
  goToReviews: string
  noReviews: string
  readReviews: string
  reviewPlural: string
  reviewSingular: string
}

export type ProductRatingAnchorDisplay = {
  ariaLabel: string
  href: string
  label: string
  rating: number
  ratingLabel: string
}

export function getProductRatingAnchorDisplay(
  summary: ProductReviewSummary,
  locale: string,
  options: ProductRatingAnchorCopy & { href: string },
): ProductRatingAnchorDisplay {
  const hasReviews = summary.reviewCount > 0
  const countLabel = hasReviews
    ? `${formatNumber(summary.reviewCount, locale)} ${
        summary.reviewCount === 1
          ? options.reviewSingular
          : options.reviewPlural
      }`
    : options.noReviews

  return {
    ariaLabel: hasReviews ? options.readReviews : options.goToReviews,
    href: options.href,
    label: hasReviews
      ? `${formatReviewRating(summary.averageRating)} (${countLabel})`
      : countLabel,
    rating: summary.averageRating,
    ratingLabel: `${formatReviewRating(summary.averageRating)} / 5`,
  }
}
