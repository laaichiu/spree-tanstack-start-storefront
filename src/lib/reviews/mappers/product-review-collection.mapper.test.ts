// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  mapProductReview,
  mapProductReviewSummary,
  mapProductReviewsPage,
} from './product-review.mapper'
import { ReviewItemResponseTypeMismatchError } from '../utils/review-item-response'
import { ReviewSummaryResponseTypeMismatchError } from '../utils/review-summary-response'

const review = {
  answers: [],
  body: 'A useful review.',
  created_at: '2026-08-26T00:00:00Z',
  current_vote: null,
  helpful_count: 0,
  id: 'rev_review',
  media: [],
  not_helpful_count: 0,
  product_id: 'prod_product',
  purchased_option_values: [],
  rating: 5,
  reviewer_display_name: null,
  title: 'Great fit',
  variant_id: null,
  verified_purchase: true,
}

describe('product review response mappers', () => {
  it('maps a review with a Review resource identity', () => {
    expect(mapProductReview(review)).toMatchObject({
      body: 'A useful review.',
      id: 'rev_review',
      productId: 'prod_product',
      rating: 5,
      title: 'Great fit',
    })
  })

  it('maps nested media and answers without synthetic identities', () => {
    expect(
      mapProductReview({
        ...review,
        answers: [
          {
            id: 'revans_answer',
            kind: 'single_select',
            label: 'True to size',
            option_id: 'revopt_true',
            question_id: 'revq_fit',
            question_key: 'fit',
            question_label: 'Fit',
            value: 'true_to_size',
          },
        ],
        media: [
          {
            alt: 'Fit photo',
            id: 'rmedia_photo',
            position: 0,
            url: ' https://cdn.example.test/review.jpg ',
          },
        ],
      }),
    ).toMatchObject({
      answers: [
        {
          id: 'revans_answer',
          label: 'True to size',
          questionId: 'revq_fit',
          questionKey: 'fit',
          questionLabel: 'Fit',
          value: 'true_to_size',
        },
      ],
      media: [
        {
          alt: 'Fit photo',
          id: 'rmedia_photo',
          position: 0,
          url: 'https://cdn.example.test/review.jpg',
        },
      ],
    })
  })

  it('normalizes primitive boolean and scale answer labels', () => {
    expect(
      mapProductReview({
        ...review,
        answers: [
          {
            id: 'revans_boolean',
            kind: 'boolean',
            label: true,
            option_id: null,
            question_id: 'revq_recommend',
            question_key: 'recommend',
            question_label: 'Would recommend',
            value: true,
          },
          {
            id: 'revans_scale',
            kind: 'scale',
            label: 4,
            option_id: null,
            question_id: 'revq_fit_score',
            question_key: 'fit_score',
            question_label: 'Fit score',
            value: 4,
          },
        ],
      }),
    ).toMatchObject({
      answers: [
        { id: 'revans_boolean', label: 'true', value: true },
        { id: 'revans_scale', label: '4', value: 4 },
      ],
    })
  })

  it.each([
    { ...review, id: 'card_not-a-review' },
    { ...review, id: '' },
    { ...review, id: undefined },
  ])('rejects a review without a Review resource identity', (value) => {
    expect(mapProductReview(value)).toBeNull()
  })

  it.each([
    { ...review, product_id: 'product_product' },
    { ...review, rating: '5' },
    { ...review, helpful_count: '0' },
    { ...review, verified_purchase: 'true' },
    { ...review, media: [{ id: 'rmedia_photo' }] },
    { ...review, answers: [{ id: 'revans_answer' }] },
  ])('rejects a malformed review response: %o', (value) => {
    expect(() => mapProductReview(value)).toThrow(
      ReviewItemResponseTypeMismatchError,
    )
  })

  it('does not silently drop an invalid review from a page', () => {
    expect(() =>
      mapProductReviewsPage({
        data: [{ ...review, id: 'card_not-a-review' }],
        meta: {
          count: 1,
          limit: 10,
          next: null,
          page: 1,
          pages: 1,
          previous: null,
        },
      }),
    ).toThrow('not a review resource')
  })

  it('preserves validated pagination metadata', () => {
    expect(
      mapProductReviewsPage({
        data: [review],
        meta: {
          count: 21,
          limit: 5,
          next: 3,
          page: 2,
          pages: 5,
          previous: 1,
        },
      }).pagination,
    ).toEqual({
      count: 21,
      limit: 5,
      nextPage: 3,
      page: 2,
      pageCount: 5,
      previousPage: 1,
    })
  })

  it.each([
    null,
    [],
    'response',
    123,
    {},
    { data: null },
    { data: {} },
    { data: [] },
    { data: [], meta: {} },
  ])('rejects a malformed review list envelope: %s', (value) => {
    expect(() => mapProductReviewsPage(value)).toThrow(
      'review list response is malformed',
    )
  })

  it('rejects a summary without a review product resource identity', () => {
    expect(() =>
      mapProductReviewSummary({
        average_rating: 5,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        reviews_count: 1,
      }),
    ).toThrow(ReviewSummaryResponseTypeMismatchError)
  })
})
