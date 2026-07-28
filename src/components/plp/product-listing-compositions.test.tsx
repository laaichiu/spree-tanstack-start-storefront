import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { ProductListingControllerValue } from '@/components/plp/product-listing-controller'
import { ProductListingEditorialView } from '@/components/plp/product-listing-editorial-view'
import { ProductListingReferenceView } from '@/components/plp/product-listing-reference-view'
import { ProductListingResults } from '@/components/plp/product-listing-results'
import type { CategoryDetail } from '@/lib/catalog/model/category'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import { createCollectionListingPage } from '@/lib/catalog/utils/product-listing-page'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    'aria-label': ariaLabel,
    children,
    className,
  }: {
    'aria-label'?: string
    children: ReactNode
    className?: string
  }) => (
    <a aria-label={ariaLabel} className={className} href="/fixture-link">
      {children}
    </a>
  ),
}))

const category = {
  breadcrumbs: [
    { id: 'category-kitchen', name: 'Kitchen', permalink: 'kitchen' },
    {
      id: 'category-drinkware',
      name: 'Drinkware',
      permalink: 'kitchen/drinkware',
    },
  ],
  description: 'Tools for a considered table.',
  id: 'category-drinkware',
  imageUrl: null,
  metaDescription: null,
  metaTitle: null,
  name: 'Drinkware',
  permalink: 'kitchen/drinkware',
} satisfies CategoryDetail

const page = createCollectionListingPage({
  listing: {
    category,
    filters: null,
    meta: {
      count: 30,
      from: 1,
      limit: 24,
      page: 1,
      pages: 2,
      to: 2,
    },
    products: [
      {
        description: 'A useful mug.',
        id: 'product-mug',
        image: null,
        inStock: true,
        name: 'Everyday Mug',
        price: { amount: 12, currencyCode: 'USD' },
        slug: 'everyday-mug',
      },
      {
        description: 'A companion cup.',
        id: 'product-cup',
        image: null,
        inStock: true,
        name: 'Companion Cup',
        price: { amount: 8, currencyCode: 'USD' },
        slug: 'companion-cup',
      },
    ],
  },
  locale: 'en',
  search: DEFAULT_PRODUCT_LISTING_SEARCH,
})

function createController() {
  const applySearch = vi.fn()
  const goToNext = vi.fn()
  const controller: ProductListingControllerValue = {
    applySearch,
    page,
    pagination: {
      canGoNext: true,
      canGoPrevious: false,
      currentPage: 1,
      goToNext,
      goToPrevious: vi.fn(),
      pageLabel: '1 / 2',
      rangeLabel: 'Showing 1 - 2 of 30 products',
      totalPages: 2,
    },
    totalCount: 30,
  }

  return { applySearch, controller, goToNext }
}

function renderWithMarket(element: ReactNode) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {element}
    </MarketProvider>,
  )
}

function renderComposition(
  View: ComponentType<{ controller: ProductListingControllerValue }>,
) {
  const fixture = createController()

  renderWithMarket(<View controller={fixture.controller} />)

  return fixture
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe.each([
  ['reference', ProductListingReferenceView],
  ['editorial', ProductListingEditorialView],
] as const)('%s product listing composition', (_name, View) => {
  it('renders the same normalized catalog and pagination capabilities', () => {
    const { goToNext } = renderComposition(View)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Drinkware' }),
    ).toBeTruthy()
    expect(screen.getByText('Tools for a considered table.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'View Everyday Mug' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'View Companion Cup' }),
    ).toBeTruthy()
    expect(screen.getByText('Showing 1 - 2 of 30 products')).toBeTruthy()
    expect(screen.getByText('1 / 2')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'All filters' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(goToNext).toHaveBeenCalledOnce()
  })
})

it('only compacts the mobile reference view when its bordered toolbar renders', () => {
  const fixture = createController()
  const view = renderWithMarket(
    <ProductListingReferenceView controller={fixture.controller} />,
  )
  const listing = view.container.firstElementChild

  expect(listing?.classList.contains('pt-2')).toBe(true)
  expect(listing?.classList.contains('md:pt-6')).toBe(true)

  view.rerender(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      <ProductListingReferenceView
        controller={{
          ...fixture.controller,
          page: { ...page, status: 'error' },
        }}
      />
    </MarketProvider>,
  )

  expect(listing?.classList.contains('pt-2')).toBe(false)
  expect(listing?.classList.contains('pt-6')).toBe(true)
})

it('renders stable empty and error states from the page contract', () => {
  const view = renderWithMarket(
    <ProductListingResults
      page={{
        ...page,
        meta: { ...page.meta!, count: 0, from: 0, to: 0 },
        products: [],
      }}
    />,
  )

  expect(
    screen.getByRole('heading', { name: 'No products found' }),
  ).toBeTruthy()

  view.rerender(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      <ProductListingResults
        page={{ ...page, meta: null, products: [], status: 'error' }}
      />
    </MarketProvider>,
  )

  expect(
    screen.getByRole('heading', { name: 'Products could not be loaded' }),
  ).toBeTruthy()
})

it('keeps listing compositions outside commerce infrastructure boundaries', () => {
  const compositionFiles = [
    'product-listing-page.tsx',
    'product-listing-controller.tsx',
    'product-listing-editorial-view.tsx',
    'product-listing-reference-view.tsx',
    'product-listing-heading.tsx',
    'product-listing-pagination.tsx',
    'product-listing-results.tsx',
  ]
  const source = compositionFiles
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n')

  expect(source).not.toMatch(/@spree\/sdk|@tanstack\/react-query/)
  expect(source).not.toMatch(/\/lib\/(?:spree|cookies|env)(?:\/|')/)
  expect(source).not.toMatch(/\.server(?:'|")/)
  expect(source).not.toContain('product-listing-editorial-view')
})
