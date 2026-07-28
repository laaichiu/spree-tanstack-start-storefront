import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProductSummary } from '@/lib/catalog/model/product'

import { SearchSuggestionsPanel } from './search-suggestions-panel'

const carouselState = vi.hoisted(() => ({
  indicator: {
    activePage: 0,
    hasOverflow: true,
    pageCount: 2,
    progress: 0,
    thumbWidthPercent: 50,
  },
  onClickCapture: vi.fn(),
  onDragStart: vi.fn(),
  onMouseDownCapture: vi.fn(),
  scrollerRef: vi.fn(),
  scrollToPage: vi.fn(),
}))

vi.mock('./use-search-suggestions-carousel', () => ({
  useSearchSuggestionsCarousel: () => carouselState,
}))

const translations: Record<string, string> = {
  'footer.retryInteractive': 'Try again',
  'header.categories': 'Categories',
  'header.noSuggestedProducts': 'No suggested items yet.',
  'header.popularSearchAirFryer': 'Air fryer',
  'header.popularSearchBlender': 'Blender',
  'header.popularSearchCoffee': 'Coffee',
  'header.popularSearchHairDryer': 'Hair dryer',
  'header.popularSearches': 'Popular searches',
  'header.popularSearchVacuum': 'Vacuum',
  'header.suggestedProducts': 'Suggested items',
  'header.suggestedProductsUnavailable':
    'Suggested items are unavailable right now.',
  'product.imageComingSoon': 'Image coming soon',
}

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    onClick,
  }: {
    children: ReactNode
    onClick?: () => void
  }) => (
    <a href="/fixture-product" onClick={onClick}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) => translations[key] ?? key,
  }),
}))

const product: ProductSummary = {
  description: 'A useful mug.',
  id: 'product-mug',
  image: null,
  inStock: true,
  name: 'Everyday Mug',
  price: { amount: 12, currencyCode: 'USD' },
  slug: 'everyday-mug',
}

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof SearchSuggestionsPanel>> = {},
) {
  const props: React.ComponentProps<typeof SearchSuggestionsPanel> = {
    categories: [],
    failed: false,
    loading: false,
    onNavigateToSearchResults: vi.fn(),
    onRetry: vi.fn(),
    onSelect: vi.fn(),
    open: true,
    products: [],
    ...overrides,
  }

  return { ...render(<SearchSuggestionsPanel {...props} />), props }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SearchSuggestionsPanel', () => {
  it('keeps localized popular searches and renders suggested products', () => {
    renderPanel({ products: [product] })

    expect(
      screen.getByRole('heading', { name: 'Popular searches' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Coffee' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Air fryer' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Blender' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Vacuum' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hair dryer' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Coffee' }).className).toContain(
      'link-underline-sweep',
    )
    expect(
      screen.getByRole('heading', { name: 'Suggested items' }),
    ).toBeTruthy()
    expect(screen.getByText('Everyday Mug')).toBeTruthy()
  })

  it('navigates when a popular search is selected', () => {
    const onNavigateToSearchResults = vi.fn()
    renderPanel({ onNavigateToSearchResults })

    fireEvent.click(screen.getByRole('button', { name: 'Air fryer' }))

    expect(onNavigateToSearchResults).toHaveBeenCalledWith('Air fryer')
  })

  it('renders pagination controls when suggested items overflow', () => {
    renderPanel({ products: [product] })

    expect(
      screen.getByRole('button', { name: 'Suggested items 1' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Suggested items 2' }),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Suggested items 2' }))

    expect(carouselState.scrollToPage).toHaveBeenCalledWith(1)
  })

  it('shows loading, error, and empty states for suggested products', () => {
    const { container } = renderPanel({ loading: true })
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()

    cleanup()
    const onRetry = vi.fn()
    renderPanel({ failed: true, onRetry })
    expect(screen.getByRole('status').textContent).toContain(
      'Suggested items are unavailable right now.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()

    cleanup()
    renderPanel()
    expect(screen.getByRole('status').textContent).toContain(
      'No suggested items yet.',
    )
  })
})
