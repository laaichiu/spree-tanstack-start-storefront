import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductReviewsSection } from './product-reviews-section'

const state = vi.hoisted(() => ({
  market: { country: 'us', locale: 'en' },
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: state.market,
    t: (key: string) => key,
  }),
}))

vi.mock('./product-reviews-ready-section', () => ({
  ProductReviewsReadySection: () => {
    const instance = React.useId()

    return <div data-testid="reviews-ready-instance">{instance}</div>
  },
}))

const feature = {
  filters: {
    defaultSort: 'most_recent' as const,
    filters: [],
    sortOptions: [],
  },
  initialPage: {
    pagination: {
      count: 1,
      limit: 10,
      nextPage: null,
      page: 1,
      pageCount: 1,
      previousPage: null,
    },
    reviews: [],
  },
  status: 'ready' as const,
  summary: {
    averageRating: 5,
    productId: 'prod_product',
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    reviewCount: 1,
  },
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  state.market = { country: 'us', locale: 'en' }
})

describe('ProductReviewsSection market ownership', () => {
  it('remounts the ready controller when the market changes', () => {
    const { rerender } = render(
      <ProductReviewsSection feature={feature} productId="prod_product" />,
    )
    const initialInstance = screen.getByTestId(
      'reviews-ready-instance',
    ).textContent

    state.market = { country: 'de', locale: 'de-DE' }
    rerender(
      <ProductReviewsSection feature={feature} productId="prod_product" />,
    )

    expect(screen.getByTestId('reviews-ready-instance').textContent).not.toBe(
      initialInstance,
    )
  })
})
