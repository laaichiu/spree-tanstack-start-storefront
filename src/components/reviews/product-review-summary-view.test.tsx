import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PRODUCT_REVIEWS_SUMMARY_ID } from './product-reviews-target-ids'
import { ProductReviewSummaryView } from './product-review-summary-view'

afterEach(cleanup)

describe('ProductReviewSummaryView', () => {
  it('renders the rating summary scroll target', () => {
    render(
      <ProductReviewSummaryView
        model={{
          averageRating: 4.5,
          overallRatingLabel: '4.5 Overall Rating',
          ratingBars: [
            { countLabel: '1', rating: 5, widthPercent: 100 },
            { countLabel: '1', rating: 4, widthPercent: 100 },
          ],
          ratingLabel: '4.5 / 5',
          reviewCountLabel: '2 Reviews',
        }}
      />,
    )

    const summary = document.getElementById(PRODUCT_REVIEWS_SUMMARY_ID)

    expect(screen.getByText('4.5 Overall Rating')).toBeTruthy()
    expect(summary?.id).toBe(PRODUCT_REVIEWS_SUMMARY_ID)
  })
})
