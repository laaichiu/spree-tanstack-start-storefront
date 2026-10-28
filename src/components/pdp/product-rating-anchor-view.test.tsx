import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ProductRatingAnchorView } from './product-rating-anchor-view'

afterEach(cleanup)

describe('ProductRatingAnchorView', () => {
  it('presents the review link and accessible rating label', () => {
    render(
      <ProductRatingAnchorView
        model={{
          ariaLabel: 'Read reviews',
          href: '#reviews',
          label: '4.5 (2 reviews)',
          rating: 4.5,
          ratingLabel: '4.5 / 5',
        }}
      />,
    )

    expect(screen.getByRole('link', { name: 'Read reviews' })).toHaveProperty(
      'hash',
      '#reviews',
    )
    expect(screen.getByText('4.5 (2 reviews)')).toBeTruthy()
    expect(screen.getByLabelText('4.5 / 5')).toBeTruthy()
  })
})
