import { PRODUCT_REVIEW_RATINGS } from '@/lib/reviews/contracts'
import type {
  ProductReviewRating,
  ProductReviewSummary,
} from '@/lib/reviews/contracts'

export type ProductReviewSummaryBar = {
  count: number
  rating: ProductReviewRating
  widthPercent: number
}

export function getReviewSummaryBars(
  summary: ProductReviewSummary,
): ProductReviewSummaryBar[] {
  const maxRatingCount = Math.max(
    1,
    ...PRODUCT_REVIEW_RATINGS.map(
      (rating) => summary.ratingDistribution[rating],
    ),
  )

  return PRODUCT_REVIEW_RATINGS.map((rating) => {
    const count = summary.ratingDistribution[rating]

    return {
      count,
      rating,
      widthPercent: Math.round((count / maxRatingCount) * 100),
    }
  })
}
