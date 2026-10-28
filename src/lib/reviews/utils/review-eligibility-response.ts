import {
  isReviewOrderResourceId,
  isReviewProductResourceId,
  isReviewResourceId,
  isReviewVariantResourceId,
} from './review-product-identity'

export const REVIEW_ELIGIBILITY_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The product review eligibility response is malformed.'

export class ReviewEligibilityResponseTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_ELIGIBILITY_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewEligibilityResponseTypeMismatchError'
  }
}

export type ReviewEligibilityResponse = {
  already_reviewed: boolean
  can_review: boolean
  eligible_order_id: string | null
  order_id: string | null
  product_id: string
  reason: string | null
  review_id: string | null
  variant_id: string | null
  verified_purchase: boolean
}

const REVIEW_ELIGIBILITY_REASONS = new Set([
  'already_reviewed',
  'login_required',
  'not_purchased',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableResourceId(
  value: unknown,
  isResourceId: (candidate: unknown) => candidate is string,
): value is string | null {
  return value === null || isResourceId(value)
}

function isReviewEligibilityReason(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === 'string' && REVIEW_ELIGIBILITY_REASONS.has(value))
  )
}

function hasConsistentEligibilityFlags(response: Record<string, unknown>) {
  return (
    response.can_review === (response.reason === null) &&
    response.already_reviewed === (response.review_id !== null) &&
    response.verified_purchase === (response.eligible_order_id !== null) &&
    (!response.can_review || !response.already_reviewed)
  )
}

export function assertReviewEligibilityResponse(
  response: unknown,
): asserts response is ReviewEligibilityResponse {
  if (
    !isRecord(response) ||
    !isReviewProductResourceId(response.product_id) ||
    !isNullableResourceId(response.variant_id, isReviewVariantResourceId) ||
    !isNullableResourceId(response.order_id, isReviewOrderResourceId) ||
    !isNullableResourceId(
      response.eligible_order_id,
      isReviewOrderResourceId,
    ) ||
    !isNullableResourceId(response.review_id, isReviewResourceId) ||
    !isReviewEligibilityReason(response.reason) ||
    typeof response.can_review !== 'boolean' ||
    typeof response.already_reviewed !== 'boolean' ||
    typeof response.verified_purchase !== 'boolean'
  ) {
    throw new ReviewEligibilityResponseTypeMismatchError()
  }

  if (!hasConsistentEligibilityFlags(response)) {
    throw new ReviewEligibilityResponseTypeMismatchError()
  }
}
