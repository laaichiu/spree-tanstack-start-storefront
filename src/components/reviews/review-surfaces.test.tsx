import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'
import type {
  ProductReviewFilters,
  ProductReviewQuery,
  ProductReviewSummary,
} from '@/lib/reviews/model/product-review'

import { AccountOrderReviews } from './account-order-reviews'
import { ProductRatingAnchor } from './product-rating-anchor'
import { ProductReviewCard } from './product-review-card'
import { ProductReviewControls } from './product-review-controls'
import { ProductReviewSummaryPanel } from './product-review-summary'
import { ProductReviewsSection } from './product-reviews-section'
import { ReviewMediaLightbox } from './review-media-lightbox'

afterEach(() => {
  cleanup()
})

function renderWithMarket(element: ReactElement) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {element}
    </MarketProvider>,
  )
}

const summary: ProductReviewSummary = {
  averageRating: 4.5,
  productId: 'prod_123',
  ratingDistribution: { 1: 0, 2: 1, 3: 1, 4: 4, 5: 6 },
  reviewCount: 12,
}

describe('review storefront surfaces', () => {
  it('renders the PDP anchor and old-storefront rating distribution from normalized data', () => {
    renderWithMarket(
      <>
        <ProductRatingAnchor summary={summary} />
        <ProductReviewSummaryPanel summary={summary} />
      </>,
    )

    expect(
      screen
        .getByRole('link', { name: 'Read customer reviews' })
        .getAttribute('href'),
    ).toBe('#product-reviews')
    expect(screen.getByText('4.5 Overall Rating')).toBeTruthy()
    expect(screen.getAllByText('12 reviews')).toHaveLength(1)
  })

  it('resets pagination when a review filter changes', () => {
    const onChange = vi.fn()
    const query: ProductReviewQuery = {
      answerFilters: {},
      page: 3,
      ratings: [],
      sort: 'most_recent',
      verifiedPurchase: false,
      withImages: false,
    }
    const filters: ProductReviewFilters = {
      defaultSort: 'most_recent',
      filters: [
        {
          id: 'rating',
          label: 'Rating',
          type: 'rating',
          values: [{ count: 6, label: '5 stars', value: '5' }],
        },
      ],
      sortOptions: ['most_recent', 'highest_rating'],
    }

    renderWithMarket(
      <ProductReviewControls
        filters={filters}
        onChange={onChange}
        onClear={vi.fn()}
        query={query}
      />,
    )
    fireEvent.change(screen.getByLabelText('Rating'), {
      target: { value: '5' },
    })

    expect(onChange).toHaveBeenCalledWith({
      ...query,
      page: 1,
      ratings: ['5'],
    })
  })

  it('keeps account review entry points inside the removable reviews feature', () => {
    renderWithMarket(
      <AccountOrderReviews
        items={[
          {
            id: 'line_123',
            imageUrl: null,
            name: 'Automatic Espresso Machine',
            optionsText: 'Matte Black',
            productId: 'automatic-espresso-machine',
            variantId: 'variant_123',
          },
        ]}
        orderId="or_123"
      />,
    )

    expect(screen.getByText('Review your products')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Write a review' })).toBeTruthy()
  })

  it('renders a normalized verified review and exposes helpful voting', () => {
    const onVote = vi.fn()

    renderWithMarket(
      <ProductReviewCard
        failedVote={false}
        onMediaClick={vi.fn()}
        onVote={onVote}
        pendingVote={false}
        review={{
          answers: [],
          body: 'Consistent coffee and easy cleanup.',
          createdAt: '2026-07-18T08:00:00Z',
          currentVote: null,
          helpfulCount: 8,
          id: 'rev_123',
          media: [],
          notHelpfulCount: 1,
          productId: 'prod_123',
          purchasedOptionValues: ['Matte Black'],
          rating: 5,
          reviewerName: 'Theresa C.',
          title: 'Built for every morning',
          variantId: 'variant_123',
          verifiedPurchase: true,
        }}
      />,
    )

    expect(screen.getByText('Verified Buyer')).toBeTruthy()
    expect(screen.getByText('Built for every morning')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Helpful (8)' }))
    expect(onVote).toHaveBeenCalledWith('helpful')
  })

  it('opens review media in the old-storefront gallery flow', () => {
    const onSelectId = vi.fn()
    const review = {
      answers: [],
      body: 'Consistent coffee and easy cleanup.',
      createdAt: '2026-07-18T08:00:00Z',
      currentVote: null,
      helpfulCount: 8,
      id: 'rev_123',
      media: [
        { alt: 'Front view', id: 'media_1', position: 1, url: '/front.jpg' },
        { alt: 'Side view', id: 'media_2', position: 2, url: '/side.jpg' },
      ],
      notHelpfulCount: 1,
      productId: 'prod_123',
      purchasedOptionValues: ['Matte Black'],
      rating: 5 as const,
      reviewerName: 'Theresa C.',
      title: 'Built for every morning',
      variantId: 'variant_123',
      verifiedPurchase: true,
    }

    document.body.style.overflow = 'auto'
    const view = renderWithMarket(
      <ReviewMediaLightbox
        items={review.media.map((media) => ({
          id: `${review.id}:${media.id}`,
          media,
          review,
        }))}
        onClose={vi.fn()}
        onSelectId={onSelectId}
        selectedId="rev_123:media_1"
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Review photo gallery' }),
    ).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button', { name: 'Next review photo' }))
    expect(onSelectId).toHaveBeenCalledWith('rev_123:media_2')
    view.unmount()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.removeProperty('overflow')
  })

  it('keeps a stable unavailable state when the optional backend is missing', () => {
    renderWithMarket(
      <ProductReviewsSection
        feature={{ status: 'unavailable' }}
        productId="prod_123"
      />,
    )

    expect(screen.getByText('Reviews are unavailable')).toBeTruthy()
    expect(
      screen.getByText(
        'Product details are still available. Try the reviews again later.',
      ),
    ).toBeTruthy()
  })

  it('renders a simple empty state without the overall rating summary', () => {
    renderWithMarket(
      <ProductReviewsSection
        feature={{
          filters: {
            defaultSort: 'most_recent',
            filters: [],
            sortOptions: ['most_recent'],
          },
          initialPage: {
            pagination: {
              count: 0,
              limit: 10,
              nextPage: null,
              page: 1,
              pageCount: 0,
              previousPage: null,
            },
            reviews: [],
          },
          status: 'ready',
          summary: {
            averageRating: 0,
            productId: 'prod_123',
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            reviewCount: 0,
          },
        }}
        productId="prod_123"
      />,
    )

    expect(screen.getByText('Reviews')).toBeTruthy()
    expect(screen.getByText('No reviews yet')).toBeTruthy()
    expect(screen.queryByText('Overall rating')).toBeNull()
    expect(
      screen.queryByText(
        'Verified customer reviews will appear here after approval.',
      ),
    ).toBeNull()
  })
})
