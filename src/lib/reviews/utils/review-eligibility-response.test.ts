// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertReviewEligibilityResponse,
  ReviewEligibilityResponseTypeMismatchError,
} from './review-eligibility-response'

const validResponse = {
  already_reviewed: false,
  can_review: true,
  eligible_order_id: 'or_order',
  order_id: 'or_order',
  product_id: 'prod_product',
  reason: null,
  review_id: null,
  variant_id: 'variant_product',
  verified_purchase: true,
}

describe('review eligibility response boundary', () => {
  it('accepts the current serializer shape', () => {
    expect(() => assertReviewEligibilityResponse(validResponse)).not.toThrow()
  })

  it('accepts nullable optional identities', () => {
    expect(() =>
      assertReviewEligibilityResponse({
        ...validResponse,
        can_review: false,
        eligible_order_id: null,
        order_id: null,
        reason: 'not_purchased',
        review_id: null,
        variant_id: null,
        verified_purchase: false,
      }),
    ).not.toThrow()
  })

  it.each([
    ['missing product identity', { product_id: undefined }],
    ['wrong product identity', { product_id: 'product_123' }],
    ['wrong variant identity', { variant_id: 'prod_123' }],
    ['wrong order identity', { order_id: 'cart_123' }],
    ['wrong eligible order identity', { eligible_order_id: 'cart_123' }],
    ['wrong review identity', { review_id: 'prod_123' }],
    ['non-boolean can-review flag', { can_review: 'true' }],
    ['non-boolean reviewed flag', { already_reviewed: 1 }],
    ['non-boolean purchase flag', { verified_purchase: null }],
    ['non-string reason', { reason: 42 }],
    ['blank reason', { reason: '   ' }],
    ['unknown reason', { reason: 'temporarily_unavailable' }],
    ['reviewable response with a reason', { reason: 'not_purchased' }],
    ['not-reviewable response without a reason', { can_review: false }],
    [
      'reviewed response without a review id',
      { already_reviewed: true, can_review: false, reason: 'already_reviewed' },
    ],
    [
      'unverified response with an eligible order',
      {
        verified_purchase: false,
      },
    ],
    ['reviewable and already-reviewed flags', { already_reviewed: true }],
  ])('rejects a malformed %s', (_reason, override) => {
    expect(() =>
      assertReviewEligibilityResponse({ ...validResponse, ...override }),
    ).toThrow(ReviewEligibilityResponseTypeMismatchError)
  })
})
