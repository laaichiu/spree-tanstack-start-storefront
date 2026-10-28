// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertReviewFiltersResponse,
  ReviewFiltersResponseTypeMismatchError,
} from './review-filters-response'
import {
  assertReviewSummaryResponse,
  ReviewSummaryResponseTypeMismatchError,
} from './review-summary-response'

const summary = {
  average_rating: 4.25,
  product_id: 'prod_product',
  rating_distribution: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 1 },
  reviews_count: 4,
}

const filters = {
  default_sort: 'most_recent',
  filters: [
    {
      id: 'rating',
      label: 'Rating',
      type: 'rating',
      values: [{ count: 2, label: '5 stars', value: '5' }],
    },
  ],
  sort_options: [
    { id: 'most_recent', label: 'Most recent' },
    { id: 'highest_rating', label: 'Highest rating' },
  ],
}

describe('review overview response boundaries', () => {
  it('accepts the current summary serializer shape', () => {
    expect(() => assertReviewSummaryResponse(summary)).not.toThrow()
  })

  it.each([
    ['missing product identity', { product_id: undefined }],
    ['wrong product identity', { product_id: 'product_product' }],
    ['numeric average as string', { average_rating: '4.25' }],
    ['out-of-range average', { average_rating: 6 }],
    ['non-integer review count', { reviews_count: '4' }],
    ['missing rating distribution', { rating_distribution: undefined }],
    [
      'missing rating bucket',
      { rating_distribution: { 1: 0, 2: 0, 3: 1, 4: 2 } },
    ],
    [
      'negative rating count',
      { rating_distribution: { 1: -1, 2: 0, 3: 1, 4: 2, 5: 1 } },
    ],
  ])('rejects malformed summary: %s', (_reason, override) => {
    expect(() =>
      assertReviewSummaryResponse({ ...summary, ...override }),
    ).toThrow(ReviewSummaryResponseTypeMismatchError)
  })

  it('accepts the current filters serializer shape', () => {
    expect(() => assertReviewFiltersResponse(filters)).not.toThrow()
  })

  it.each([
    ['invalid default sort', { default_sort: 'unknown' }],
    ['missing filters array', { filters: null }],
    [
      'malformed filter value',
      {
        filters: [
          {
            ...filters.filters[0],
            values: [{ count: '2', label: '5 stars', value: '5' }],
          },
        ],
      },
    ],
    ['missing sort options array', { sort_options: {} }],
    [
      'malformed sort option',
      { sort_options: [{ id: 'most_recent', label: '' }] },
    ],
  ])('rejects malformed filters: %s', (_reason, override) => {
    expect(() =>
      assertReviewFiltersResponse({ ...filters, ...override }),
    ).toThrow(ReviewFiltersResponseTypeMismatchError)
  })
})
