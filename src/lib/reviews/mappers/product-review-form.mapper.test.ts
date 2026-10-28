// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  mapProductReviewFormState,
  mapProductReviewMediaUpload,
} from './product-review-form.mapper'
import { ReviewEligibilityResponseTypeMismatchError } from '../utils/review-eligibility-response'
import { ReviewMediaUploadResponseTypeMismatchError } from '../utils/review-media-upload-response'

const eligibility = {
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

const question = {
  filterable: true,
  id: 'revq_fit',
  key: 'fit',
  kind: 'single_select',
  label: 'Fit',
  options: [
    {
      id: 'revopt_true',
      label: 'True to size',
      value: 'true_to_size',
    },
  ],
  required: true,
}

describe('product review form mapper', () => {
  it('maps the complete questions response into the normalized form contract', () => {
    expect(
      mapProductReviewFormState({
        eligibility,
        questions: { data: [question] },
      }),
    ).toEqual({
      eligibility: {
        alreadyReviewed: false,
        canReview: true,
        eligibleOrderId: 'or_order',
        orderId: 'or_order',
        productId: 'prod_product',
        reason: null,
        reviewId: null,
        variantId: 'variant_product',
        verifiedPurchase: true,
      },
      questions: [
        {
          filterable: true,
          id: 'revq_fit',
          key: 'fit',
          kind: 'single_select',
          label: 'Fit',
          options: [
            {
              id: 'revopt_true',
              label: 'True to size',
              value: 'true_to_size',
            },
          ],
          required: true,
        },
      ],
    })
  })

  it.each([
    null,
    {},
    { data: null },
    { data: {} },
    { data: [{ ...question, id: 'prod_wrong' }] },
    { data: [{ ...question, required: undefined }] },
    {
      data: [
        {
          ...question,
          options: [{ ...question.options[0], id: 'prod_wrong' }],
        },
      ],
    },
  ])('rejects malformed questions response: %o', (questions) => {
    expect(() => mapProductReviewFormState({ eligibility, questions })).toThrow(
      'product review questions response is malformed',
    )
  })

  it('accepts nullable optional eligibility identities from the serializer', () => {
    expect(() =>
      mapProductReviewFormState({
        eligibility: {
          ...eligibility,
          can_review: false,
          eligible_order_id: null,
          order_id: null,
          reason: 'not_purchased',
          review_id: null,
          variant_id: null,
          verified_purchase: false,
        },
        questions: { data: [] },
      }),
    ).not.toThrow()
  })

  it.each([
    null,
    {},
    { ...eligibility, product_id: 'localized-product' },
    { ...eligibility, variant_id: 'prod_wrong' },
    { ...eligibility, order_id: 'cart_wrong' },
    { ...eligibility, eligible_order_id: 'cart_wrong' },
    { ...eligibility, review_id: 'prod_wrong' },
    { ...eligibility, can_review: 'yes' },
    { ...eligibility, already_reviewed: 0 },
    { ...eligibility, verified_purchase: undefined },
    { ...eligibility, reason: 42 },
  ])('rejects malformed eligibility response: %o', (response) => {
    expect(() =>
      mapProductReviewFormState({
        eligibility: response,
        questions: { data: [] },
      }),
    ).toThrow(ReviewEligibilityResponseTypeMismatchError)
  })

  it('keeps the media upload mapper independent from the questions envelope guard', () => {
    expect(
      mapProductReviewMediaUpload({
        direct_upload: {
          headers: { 'Content-Type': 'image/jpeg' },
          url: '/upload',
        },
        signed_id: 'signed_image',
      }),
    ).toEqual({
      headers: { 'Content-Type': 'image/jpeg' },
      signedId: 'signed_image',
      url: '/upload',
    })
  })

  it('normalizes valid direct-upload identity and URL values', () => {
    expect(
      mapProductReviewMediaUpload({
        direct_upload: {
          headers: { 'Content-Type': 'image/jpeg' },
          url: ' https://uploads.example.test/blob?signature=abc ',
        },
        signed_id: ' signed_image ',
      }),
    ).toEqual({
      headers: { 'Content-Type': 'image/jpeg' },
      signedId: 'signed_image',
      url: 'https://uploads.example.test/blob?signature=abc',
    })
  })

  it.each([
    null,
    {},
    { signed_id: 'signed_image' },
    {
      direct_upload: {
        headers: { 'Content-Type': 'image/jpeg' },
        url: 'javascript:alert(1)',
      },
      signed_id: 'signed_image',
    },
    {
      direct_upload: {
        headers: { 'Content-Type': 'image/jpeg' },
        url: '//uploads.example.test/blob',
      },
      signed_id: 'signed_image',
    },
    {
      direct_upload: {
        headers: { 'Content-Type': 42 },
        url: '/upload',
      },
      signed_id: 'signed_image',
    },
    {
      direct_upload: {
        headers: ['Content-Type', 'image/jpeg'],
        url: '/upload',
      },
      signed_id: 'signed_image',
    },
    {
      direct_upload: {
        headers: { 'Content-Type': 'image/jpeg\nX-Injected: true' },
        url: '/upload',
      },
      signed_id: 'signed_image',
    },
  ])('rejects malformed direct-upload response: %o', (response) => {
    expect(() => mapProductReviewMediaUpload(response)).toThrow(
      ReviewMediaUploadResponseTypeMismatchError,
    )
  })
})
