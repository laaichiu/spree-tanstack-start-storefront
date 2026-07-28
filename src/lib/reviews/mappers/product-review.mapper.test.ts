import { describe, expect, it } from 'vitest'

import {
  mapProductReview,
  mapProductReviewFilters,
  mapProductReviewsPage,
  mapProductReviewSummary,
} from './product-review.mapper'
import { mapProductReviewFormState } from './product-review-form.mapper'

describe('product review mappers', () => {
  it('maps Store API review responses into the normalized review contract', () => {
    const review = mapProductReview({
      id: 'rev_abc123',
      product_id: 'prod_abc123',
      variant_id: 'variant_abc123',
      purchased_option_values: ['Matte Black', 'EU'],
      rating: 5,
      title: 'Built for every morning',
      body: 'Consistent coffee and easy cleanup.',
      verified_purchase: true,
      reviewer_display_name: 'Theresa C.',
      helpful_count: 8,
      not_helpful_count: 1,
      current_vote: 'helpful',
      created_at: '2026-07-18T08:00:00Z',
      media: [
        {
          id: 'revm_abc123',
          position: 0,
          alt: 'Espresso setup',
          url: 'https://cdn.example.com/review.webp',
        },
      ],
      answers: [
        {
          id: 'reva_abc123',
          question_id: 'revq_abc123',
          question_key: 'ease_of_use',
          question_label: 'Ease of use',
          value: 5,
          label: '5',
        },
      ],
    })

    expect(review).toMatchObject({
      currentVote: 'helpful',
      helpfulCount: 8,
      productId: 'prod_abc123',
      purchasedOptionValues: ['Matte Black', 'EU'],
      reviewerName: 'Theresa C.',
      verifiedPurchase: true,
    })
    expect(review?.media[0]).toEqual({
      alt: 'Espresso setup',
      id: 'revm_abc123',
      position: 0,
      url: 'https://cdn.example.com/review.webp',
    })
    expect(review?.answers[0]?.questionLabel).toBe('Ease of use')
  })

  it('normalizes summary, pagination, and missing review relations safely', () => {
    expect(
      mapProductReviewSummary(
        {
          average_rating: '4.25',
          reviews_count: 4,
          rating_distribution: { 5: 3, 4: 1 },
        },
        'prod_fallback',
      ),
    ).toEqual({
      averageRating: 4.25,
      productId: 'prod_fallback',
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3 },
      reviewCount: 4,
    })

    expect(
      mapProductReviewsPage({
        data: [
          { id: 'rev_1', rating: 99, media: null, answers: null },
          { rating: 3 },
        ],
        meta: { page: 2, limit: 10, count: 12, pages: 2, previous: 1 },
      }),
    ).toMatchObject({
      pagination: {
        count: 12,
        limit: 10,
        nextPage: null,
        page: 2,
        pageCount: 2,
        previousPage: 1,
      },
      reviews: [{ id: 'rev_1', rating: 5, media: [], answers: [] }],
    })
  })

  it('keeps only supported filters, sorts, and form questions', () => {
    const filters = mapProductReviewFilters({
      default_sort: 'highest_rating',
      sort_options: [
        { id: 'highest_rating', label: 'Highest rating' },
        { id: 'unknown', label: 'Unknown' },
      ],
      filters: [
        {
          id: 'rating',
          label: 'Rating',
          type: 'rating',
          values: [{ value: '5', label: '5 stars', count: 2 }],
        },
        { label: 'Missing id' },
      ],
    })
    const form = mapProductReviewFormState({
      eligibility: {
        product_id: 'prod_1',
        can_review: true,
        verified_purchase: true,
      },
      questions: {
        data: [
          {
            id: 'revq_1',
            key: 'fit',
            kind: 'single_select',
            label: 'Fit',
            required: true,
            options: [{ id: 'revqo_1', value: 'small', label: 'Runs small' }],
          },
          { id: 'revq_2', key: 'unsupported', kind: 'unknown' },
        ],
      },
    })

    expect(filters.defaultSort).toBe('highest_rating')
    expect(filters.sortOptions).toEqual(['highest_rating'])
    expect(filters.filters).toHaveLength(1)
    expect(form.eligibility.canReview).toBe(true)
    expect(form.questions).toEqual([
      {
        filterable: false,
        id: 'revq_1',
        key: 'fit',
        kind: 'single_select',
        label: 'Fit',
        options: [{ id: 'revqo_1', label: 'Runs small', value: 'small' }],
        required: true,
      },
    ])
  })
})
