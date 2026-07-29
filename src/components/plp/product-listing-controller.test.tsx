import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import { ProductListingController } from '@/components/plp/product-listing-controller'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import { createProductsListingPage } from '@/lib/catalog/utils/product-listing-page'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

const listing = {
  filters: null,
  meta: {
    count: 30,
    from: 1,
    limit: 24,
    page: 1,
    pages: 2,
    to: 24,
  },
  products: [
    {
      description: 'A useful mug.',
      id: 'product-mug',
      image: null,
      inStock: true,
      preorder: false,
      name: 'Everyday Mug',
      price: { amount: 12, currencyCode: 'USD' },
      slug: 'everyday-mug',
    },
  ],
}

const page = createProductsListingPage({
  listing,
  locale: 'en',
  search: DEFAULT_PRODUCT_LISTING_SEARCH,
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProductListingController', () => {
  it('derives pagination labels and applies the next URL search state', () => {
    const onApply = vi.fn()

    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <ProductListingController onApply={onApply} page={page}>
          {({ pagination }) => (
            <div>
              <output data-testid="range">{pagination.rangeLabel}</output>
              <output data-testid="page-label">{pagination.pageLabel}</output>
              <button
                disabled={!pagination.canGoPrevious}
                onClick={pagination.goToPrevious}
                type="button"
              >
                Previous
              </button>
              <button onClick={pagination.goToNext} type="button">
                Next
              </button>
            </div>
          )}
        </ProductListingController>
      </MarketProvider>,
    )

    expect(screen.getByTestId('range').textContent).toBe(
      'Showing 1 - 24 of 30 products',
    )
    expect(screen.getByTestId('page-label').textContent).toBe('1 / 2')
    expect(
      screen.getByRole('button', { name: 'Previous' }).hasAttribute('disabled'),
    ).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(onApply).toHaveBeenCalledWith({
      ...DEFAULT_PRODUCT_LISTING_SEARCH,
      page: 2,
    })
  })

  it('does not expose pagination actions for an error page', () => {
    const onApply = vi.fn()
    const errorPage = createProductsListingPage({
      listing: null,
      locale: 'en',
      search: DEFAULT_PRODUCT_LISTING_SEARCH,
    })

    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <ProductListingController onApply={onApply} page={errorPage}>
          {({ pagination }) => (
            <div>
              <output data-testid="range">
                {pagination.rangeLabel ?? 'none'}
              </output>
              <button onClick={pagination.goToNext} type="button">
                Next
              </button>
            </div>
          )}
        </ProductListingController>
      </MarketProvider>,
    )

    expect(screen.getByTestId('range').textContent).toBe('none')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onApply).not.toHaveBeenCalled()
  })
})
