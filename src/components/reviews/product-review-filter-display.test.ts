import { describe, expect, it } from 'vitest'

import { getVisibleReviewFilters } from './product-review-filter-display'
import type { ProductReviewFilters } from '@/lib/reviews/contracts'

describe('review filter display', () => {
  it('shows rating and photo filters without turning review questions into filters', () => {
    const values = [{ count: 2, label: 'Example', value: 'true' }]
    const filters: ProductReviewFilters = {
      defaultSort: 'most_recent',
      sortOptions: [],
      filters: [
        { id: 'rating', label: 'Rating', type: 'rating', values },
        { id: 'with_images', label: 'Photos', type: 'boolean', values },
        { id: 'verified_purchase', label: 'Verified', type: 'boolean', values },
        {
          id: 'demo_noise_level',
          label: 'Noise level',
          type: 'single_select',
          values,
        },
        { id: 'demo_recommend', label: 'Recommend', type: 'boolean', values },
      ],
    }

    expect(getVisibleReviewFilters(filters).map((filter) => filter.id)).toEqual(
      ['rating', 'with_images'],
    )
  })
})
