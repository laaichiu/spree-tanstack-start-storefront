import { cleanup, render, screen } from '@testing-library/react'
import { useId } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductListingPage } from './product-listing-page'

const state = vi.hoisted(() => ({
  market: { country: 'us', locale: 'en' },
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: state.market,
    t: (key: string) => key,
  }),
}))

vi.mock('./product-listing-controller', () => ({
  getProductListingController: () => ({
    applySearch: () => undefined,
    page: {},
    pagination: {},
    totalCount: 0,
  }),
}))

vi.mock('./product-listing-page-view', () => ({
  ProductListingPageView: () => {
    const instance = useId()

    return <div data-testid="listing-view-instance">{instance}</div>
  },
}))

afterEach(() => {
  cleanup()
  state.market.country = 'us'
  state.market.locale = 'en'
})

describe('ProductListingPage market ownership', () => {
  it('remounts listing controls and cards when the market changes', () => {
    const page = {
      category: null,
      kind: 'products',
      products: [],
      search: {},
    } as never
    const { rerender } = render(
      <ProductListingPage onApply={() => undefined} page={page} />,
    )
    const initialInstance = screen.getByTestId(
      'listing-view-instance',
    ).textContent

    state.market.country = 'de'
    state.market.locale = 'de-DE'
    rerender(<ProductListingPage onApply={() => undefined} page={page} />)

    expect(screen.getByTestId('listing-view-instance').textContent).not.toBe(
      initialInstance,
    )
  })

  it('remounts listing controls when the same market loads a new listing', () => {
    const firstPage = {
      category: null,
      kind: 'products',
      products: [],
      search: { q: undefined },
    } as never
    const nextPage = {
      category: null,
      kind: 'products',
      products: [],
      search: { q: 'boots' },
    } as never
    const { rerender } = render(
      <ProductListingPage onApply={() => undefined} page={firstPage} />,
    )
    const initialInstance = screen.getByTestId(
      'listing-view-instance',
    ).textContent

    rerender(<ProductListingPage onApply={() => undefined} page={nextPage} />)

    expect(screen.getByTestId('listing-view-instance').textContent).not.toBe(
      initialInstance,
    )
  })
})
