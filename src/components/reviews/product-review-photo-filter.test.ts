import { describe, expect, it } from 'vitest'

import {
  getDefaultProductReviewQuery,
  setReviewFilterValue,
} from '@/lib/reviews/contracts'
import type { ProductReviewFilters } from '@/lib/reviews/contracts'
import { toProductReviewQueryParams } from '@/lib/reviews/utils/review-query-params'
import { getReviewFilterDisplays } from './product-review-filter-display'

describe('photo review filter', () => {
  it('distinguishes all reviews from photos and applies and clears the request filter', () => {
    const filters: ProductReviewFilters = {
      defaultSort: 'most_recent',
      sortOptions: ['most_recent'],
      filters: [
        {
          id: 'with_images',
          label: 'With photos',
          type: 'boolean',
          values: [{ count: 2, label: 'With photos', value: 'true' }],
        },
      ],
    }
    const all = getDefaultProductReviewQuery('most_recent')
    const [filter] = getReviewFilterDisplays(filters, all, 'All reviews')

    expect(filter.options).toEqual([
      { label: 'All reviews', value: '' },
      { label: 'With photos', value: 'true' },
    ])
    expect(filter.value).toBe('')
    expect(toProductReviewQueryParams(all)).not.toHaveProperty('with_images')

    const photos = setReviewFilterValue(all, filter.id, 'true')
    expect(
      getReviewFilterDisplays(filters, photos, 'All reviews')[0].value,
    ).toBe('true')
    expect(toProductReviewQueryParams(photos)).toHaveProperty(
      'with_images',
      true,
    )

    const photosAndRating = setReviewFilterValue(photos, 'rating', '5')
    expect(toProductReviewQueryParams(photosAndRating)).toMatchObject({
      rating: '5',
      with_images: true,
    })

    const cleared = setReviewFilterValue(photosAndRating, filter.id, '')
    expect(toProductReviewQueryParams(cleared)).not.toHaveProperty(
      'with_images',
    )
    expect(toProductReviewQueryParams(cleared)).toHaveProperty('rating', '5')
  })
})
