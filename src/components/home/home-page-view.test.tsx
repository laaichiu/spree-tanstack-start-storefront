import { cleanup, render, screen } from '@testing-library/react'
import { useId } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { HomePageModel } from '@/lib/catalog/contracts'
import { HomePageView } from './home-page-view'

const state = vi.hoisted(() => ({
  market: { country: 'us', locale: 'en' },
}))

vi.mock('./hero-view', () => ({
  HeroView: () => null,
}))

vi.mock('./home-featured-categories-view', () => ({
  HomeFeaturedCategoriesView: () => null,
}))

vi.mock('./home-featured-products-view', () => ({
  HomeFeaturedProductsView: () => {
    const instance = useId()

    return <div data-testid="featured-products-instance">{instance}</div>
  },
}))

afterEach(() => {
  cleanup()
  state.market.country = 'us'
  state.market.locale = 'en'
})

describe('HomePageView market ownership', () => {
  it('remounts featured product cards when the market changes', () => {
    const page = {
      featuredCategories: { categories: [], status: 'empty' },
      featuredProducts: { products: [], status: 'empty' },
    } satisfies HomePageModel
    const labels = {
      categories: {
        emptyDescription: '',
        emptyTitle: '',
        errorDescription: '',
        errorTitle: '',
        shopAll: '',
        title: '',
      },
      featuredProducts: {
        emptyDescription: '',
        emptyTitle: '',
        errorDescription: '',
        errorTitle: '',
        nextLabel: '',
        previousLabel: '',
        title: '',
        viewAll: '',
      },
      hero: { cta: '', description: '', eyebrow: '', title: '' },
      product: {
        discount: (percent: number) => String(percent),
        imageFallback: '',
        outOfStock: '',
        preorder: '',
      },
    }
    const { rerender } = render(
      <HomePageView labels={labels} marketParams={state.market} page={page} />,
    )
    const initialInstance = screen.getByTestId(
      'featured-products-instance',
    ).textContent

    state.market.country = 'de'
    state.market.locale = 'de-DE'
    rerender(
      <HomePageView labels={labels} marketParams={state.market} page={page} />,
    )

    expect(
      screen.getByTestId('featured-products-instance').textContent,
    ).not.toBe(initialInstance)
  })
})
