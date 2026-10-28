import { isReviewProductResourceId } from './review-product-identity'

export const REVIEW_SUMMARY_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The product review summary response is malformed.'

export class ReviewSummaryResponseTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_SUMMARY_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewSummaryResponseTypeMismatchError'
  }
}

export type ReviewSummaryResponse = {
  average_rating: number
  product_id: string
  rating_distribution: Record<string, number>
  reviews_count: number
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isRatingDistribution(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) {
    return false
  }

  return [1, 2, 3, 4, 5].every((rating) => {
    const count = value[String(rating)]

    return isNonNegativeInteger(count)
  })
}

export function assertReviewSummaryResponse(
  response: unknown,
): asserts response is ReviewSummaryResponse {
  if (
    !isRecord(response) ||
    !isReviewProductResourceId(response.product_id) ||
    typeof response.average_rating !== 'number' ||
    !Number.isFinite(response.average_rating) ||
    response.average_rating < 0 ||
    response.average_rating > 5 ||
    !isNonNegativeInteger(response.reviews_count) ||
    !isRatingDistribution(response.rating_distribution)
  ) {
    throw new ReviewSummaryResponseTypeMismatchError()
  }
}
