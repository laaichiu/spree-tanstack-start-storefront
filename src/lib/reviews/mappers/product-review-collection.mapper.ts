import type {
  ProductReviewFilter,
  ProductReviewFilters,
  ProductReviewRating,
  ProductReviewsPage,
  ProductReviewSummary,
} from '@/lib/reviews/contracts'
import { mapProductReview } from './product-review-item.mapper'
import { PRODUCT_REVIEW_RATINGS } from './product-review-values.mapper'
import type {
  ReviewFilterResponse,
  ReviewFiltersResponse,
} from '../utils/review-filters-response'
import { assertReviewFiltersResponse } from '../utils/review-filters-response'
import { ReviewResourceTypeMismatchError } from '../utils/review-product-identity'
import { assertReviewListResponse } from '../utils/review-list-response'
import type { ReviewSummaryResponse } from '../utils/review-summary-response'
import { assertReviewSummaryResponse } from '../utils/review-summary-response'

export function mapProductReviewSummary(value: unknown): ProductReviewSummary {
  assertReviewSummaryResponse(value)
  const summary: ReviewSummaryResponse = value

  return {
    averageRating: summary.average_rating,
    productId: summary.product_id,
    ratingDistribution: Object.fromEntries(
      PRODUCT_REVIEW_RATINGS.map((rating) => [
        rating,
        summary.rating_distribution[String(rating)],
      ]),
    ) as Record<ProductReviewRating, number>,
    reviewCount: summary.reviews_count,
  }
}

export function mapProductReviewsPage(value: unknown): ProductReviewsPage {
  assertReviewListResponse(value)
  const response = value

  const reviews = response.data.map((item) => {
    const review = mapProductReview(item)

    if (!review) {
      throw new ReviewResourceTypeMismatchError()
    }

    return review
  })

  return {
    pagination: {
      count: response.meta.count,
      limit: response.meta.limit,
      nextPage: response.meta.next,
      page: response.meta.page,
      pageCount: response.meta.pages,
      previousPage: response.meta.previous,
    },
    reviews,
  }
}

function mapReviewFilter(filter: ReviewFilterResponse): ProductReviewFilter {
  return {
    id: filter.id,
    label: filter.label,
    type: filter.type,
    values: filter.values.map((option) => ({
      count: option.count,
      label: option.label,
      value: option.value,
    })),
  }
}

export function mapProductReviewFilters(value: unknown): ProductReviewFilters {
  assertReviewFiltersResponse(value)
  const response: ReviewFiltersResponse = value

  return {
    defaultSort: response.default_sort,
    filters: response.filters.map(mapReviewFilter),
    sortOptions: response.sort_options.map((option) => option.id),
  }
}
