// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertReviewItemResponse,
  ReviewItemResponseTypeMismatchError,
} from './review-item-response'

const validResponse = {
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
  body: 'A useful review.',
  created_at: '2026-08-26T00:00:00Z',
  current_vote: null,
  helpful_count: 2,
  id: 'rev_review',
  media: [
    {
      alt: null,
      id: 'rmedia_photo',
      position: 0,
      url: 'https://cdn.example.test/review.jpg',
    },
  ],
  not_helpful_count: 0,
  product_id: 'prod_product',
  purchased_option_values: ['White'],
  rating: 5,
  reviewer_display_name: 'J. Brown',
  title: 'Great fit',
  variant_id: 'variant_product',
  verified_purchase: true,
}

describe('product review response boundary', () => {
  it('accepts the current review serializer shape', () => {
    expect(() => assertReviewItemResponse(validResponse)).not.toThrow()
  })

  it('accepts nullable response fields from the serializer', () => {
    expect(() =>
      assertReviewItemResponse({
        ...validResponse,
        answers: [
          {
            ...validResponse.answers[0],
            label: null,
            option_id: null,
            value: null,
          },
        ],
        current_vote: null,
        media: [{ ...validResponse.media[0], alt: null, url: null }],
        reviewer_display_name: null,
        variant_id: null,
      }),
    ).not.toThrow()
  })

  it('accepts an approved legacy review with an empty title', () => {
    expect(() =>
      assertReviewItemResponse({ ...validResponse, title: '' }),
    ).not.toThrow()
  })

  it('accepts primitive labels emitted for boolean and scale answers', () => {
    expect(() =>
      assertReviewItemResponse({
        ...validResponse,
        answers: [
          {
            ...validResponse.answers[0],
            kind: 'boolean',
            label: true,
            option_id: null,
            value: true,
          },
          {
            ...validResponse.answers[0],
            id: 'revans_scale',
            kind: 'scale',
            label: 4,
            option_id: null,
            question_id: 'revq_scale',
            question_key: 'fit_score',
            value: 4,
          },
        ],
      }),
    ).not.toThrow()
  })

  it.each([
    ['missing review identity', { id: undefined }],
    ['wrong review identity', { id: 'prod_review' }],
    ['wrong product identity', { product_id: 'product_123' }],
    ['wrong variant identity', { variant_id: 'prod_variant' }],
    ['missing title', { title: undefined }],
    ['non-string body', { body: 42 }],
    ['non-integer rating', { rating: 4.5 }],
    ['out-of-range rating', { rating: 6 }],
    ['non-integer helpful count', { helpful_count: '2' }],
    ['non-boolean purchase flag', { verified_purchase: 1 }],
    ['invalid current vote', { current_vote: 'yes' }],
    ['non-string purchased option', { purchased_option_values: [42] }],
    [
      'malformed media identity',
      { media: [{ ...validResponse.media[0], id: 'revans_media' }] },
    ],
    [
      'malformed media position',
      { media: [{ ...validResponse.media[0], position: '0' }] },
    ],
    [
      'malformed answer identity',
      { answers: [{ ...validResponse.answers[0], id: 'rmedia_answer' }] },
    ],
    [
      'malformed answer question identity',
      {
        answers: [
          { ...validResponse.answers[0], question_id: 'prod_question' },
        ],
      },
    ],
    [
      'malformed answer question label',
      { answers: [{ ...validResponse.answers[0], question_label: '   ' }] },
    ],
    [
      'malformed answer option identity',
      { answers: [{ ...validResponse.answers[0], option_id: 'prod_option' }] },
    ],
    [
      'malformed answer value',
      { answers: [{ ...validResponse.answers[0], value: { selected: true } }] },
    ],
    [
      'malformed answer label',
      { answers: [{ ...validResponse.answers[0], label: { text: 'Fit' } }] },
    ],
  ])('rejects %s', (_reason, override) => {
    expect(() =>
      assertReviewItemResponse({ ...validResponse, ...override }),
    ).toThrow(ReviewItemResponseTypeMismatchError)
  })
})
