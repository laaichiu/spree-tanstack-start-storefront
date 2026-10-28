// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertReviewResourceIsReview,
  assertReviewProductResourceMatchesRequestedLocator,
  assertReviewVariantResourceMatchesRequestedId,
  isReviewAnswerResourceId,
  isReviewMediaResourceId,
  isReviewOrderResourceId,
  isReviewProductResourceId,
  isReviewResourceId,
  isReviewVariantResourceId,
  ReviewProductResourceIdentityMismatchError,
  ReviewProductResourceTypeMismatchError,
  ReviewResourceTypeMismatchError,
  ReviewVariantResourceIdentityMismatchError,
  ReviewVariantResourceTypeMismatchError,
} from './review-product-identity'

describe('review purchase resource identity', () => {
  it.each(['prod_product', 'prod_a1B2'])(
    'recognizes a product resource id: %s',
    (id) => {
      expect(isReviewProductResourceId(id)).toBe(true)
    },
  )

  it.each(['or_order', 'order_123', '1', '', null])(
    'rejects a non-Product resource id: %s',
    (id) => {
      expect(isReviewProductResourceId(id)).toBe(false)
    },
  )

  it.each(['or_order', 'or_a1B2'])(
    'recognizes an order resource id: %s',
    (id) => {
      expect(isReviewOrderResourceId(id)).toBe(true)
    },
  )

  it.each(['order_123', 'prod_product', '1'])(
    'rejects a non-Order resource id: %s',
    (id) => {
      expect(isReviewOrderResourceId(id)).toBe(false)
    },
  )

  it.each(['variant_variant', 'variant_a1B2'])(
    'recognizes a variant resource id: %s',
    (id) => {
      expect(isReviewVariantResourceId(id)).toBe(true)
    },
  )

  it.each(['var_variant', 'prod_product', '1'])(
    'rejects a non-Variant resource id: %s',
    (id) => {
      expect(isReviewVariantResourceId(id)).toBe(false)
    },
  )

  it.each(['rev_review', 'rev_a1B2'])(
    'recognizes a review resource id: %s',
    (id) => {
      expect(isReviewResourceId(id)).toBe(true)
    },
  )

  it.each(['rmedia_media', 'rmedia_a1B2'])(
    'recognizes a review media resource id: %s',
    (id) => {
      expect(isReviewMediaResourceId(id)).toBe(true)
    },
  )

  it.each(['revans_answer', 'revans_a1B2'])(
    'recognizes a review answer resource id: %s',
    (id) => {
      expect(isReviewAnswerResourceId(id)).toBe(true)
    },
  )

  it.each(['rmedia_', 'revans_', 'rev_media', 'rev_answer', ''])(
    'rejects a non-nested review resource id: %s',
    (id) => {
      expect(isReviewMediaResourceId(id)).toBe(false)
      expect(isReviewAnswerResourceId(id)).toBe(false)
    },
  )

  it.each(['review_123', 'prod_product', ''])(
    'rejects a non-Review resource id: %s',
    (id) => {
      expect(isReviewResourceId(id)).toBe(false)
    },
  )

  it('requires a review response to contain a Review resource id', () => {
    expect(() => assertReviewResourceIsReview({ id: 'card_review' })).toThrow(
      ReviewResourceTypeMismatchError,
    )
  })

  it('accepts a localized product slug resolved by Spree', () => {
    expect(() =>
      assertReviewProductResourceMatchesRequestedLocator(
        { productId: 'prod_product' },
        'localized-product-slug',
      ),
    ).not.toThrow()
  })

  it('requires the response to contain a product resource id', () => {
    expect(() =>
      assertReviewProductResourceMatchesRequestedLocator(
        { productId: 'other-product-slug' },
        'localized-product-slug',
      ),
    ).toThrow(ReviewProductResourceTypeMismatchError)
  })

  it('matches prefixed product requests exactly', () => {
    expect(() =>
      assertReviewProductResourceMatchesRequestedLocator(
        { productId: 'prod_other' },
        'prod_requested',
      ),
    ).toThrow(ReviewProductResourceIdentityMismatchError)
  })

  it('accepts the requested review variant', () => {
    expect(() =>
      assertReviewVariantResourceMatchesRequestedId(
        { variantId: 'variant_requested' },
        'variant_requested',
      ),
    ).not.toThrow()
  })

  it.each([undefined, null, 'variant_'])(
    'rejects a missing or malformed review variant: %o',
    (variantId) => {
      expect(() =>
        assertReviewVariantResourceMatchesRequestedId(
          { variantId },
          'variant_requested',
        ),
      ).toThrow(ReviewVariantResourceTypeMismatchError)
    },
  )

  it('rejects a review response for another variant', () => {
    expect(() =>
      assertReviewVariantResourceMatchesRequestedId(
        { variantId: 'variant_other' },
        'variant_requested',
      ),
    ).toThrow(ReviewVariantResourceIdentityMismatchError)
  })
})
