import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProductSummary } from '@/lib/catalog/model/product'

import { SearchDrawer } from './search-drawer'

const navigate = vi.hoisted(() => vi.fn())
const searchPreviewProducts = vi.hoisted(() => [] as ProductSummary[])

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    onClick,
  }: {
    children: ReactNode
    onClick?: ComponentProps<'a'>['onClick']
  }) => (
    <a href="/" onClick={onClick}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}))

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => (
    <div aria-label="Search" role="dialog">
      {children}
    </div>
  ),
  SheetCloseButton: (props: ComponentProps<'button'>) => (
    <button {...props} type="button" />
  ),
  SheetContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

const translations: Record<string, string> = {
  'header.categories': 'Categories',
  'header.closeSearch': 'Close search',
  'header.search': 'Search',
  'header.searchPlaceholder': 'Search products',
  'header.viewSearchResults': 'View search results',
  'product.noProductsFound': 'No products found',
  'product.productPlural': 'products',
  'product.productSingular': 'product',
  'product.searchResultsFor': 'Search results for',
  'product.tryAnotherSearch': 'Try another search',
}

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) => translations[key] ?? key,
  }),
}))

vi.mock('@/components/layout/search-drawer/use-product-search-preview', () => ({
  useProductSearchPreview: () => ({
    data: { products: searchPreviewProducts },
    isError: false,
    isFetching: false,
  }),
}))

vi.mock('@/components/layout/search-drawer/use-search-suggestions', () => ({
  useSearchSuggestions: () => ({
    data: [],
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/components/layout/search-drawer/search-suggestions-panel', () => ({
  SearchSuggestionsPanel: () => null,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  searchPreviewProducts.length = 0
})

describe('SearchDrawer', () => {
  it('preserves the current query when the drawer closes and reopens', async () => {
    const props: ComponentProps<typeof SearchDrawer> = {
      categories: [],
      handle: {} as ComponentProps<typeof SearchDrawer>['handle'],
      onOpenChange: vi.fn(),
      open: true,
      triggerId: 'search-trigger',
    }
    const { rerender } = render(<SearchDrawer {...props} />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    fireEvent.change(input, { target: { value: 'air' } })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Search results for "air"' }),
      ).toBeTruthy()
    })

    rerender(<SearchDrawer {...props} open={false} />)
    rerender(<SearchDrawer {...props} open />)

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveProperty(
      'value',
      'air',
    )
  })

  it('shows the preview without a duplicate query shortcut and keeps Enter navigation', async () => {
    const onOpenChange = vi.fn()
    const props: ComponentProps<typeof SearchDrawer> = {
      categories: [],
      handle: {} as ComponentProps<typeof SearchDrawer>['handle'],
      onOpenChange,
      open: true,
      triggerId: 'search-trigger',
    }

    render(<SearchDrawer {...props} />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    fireEvent.change(input, { target: { value: 'air' } })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Search results for "air"' }),
      ).toBeTruthy()
    })
    expect(
      screen.queryByRole('button', { name: 'Search for "air"' }),
    ).toBeNull()

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(input).toHaveProperty('value', '')
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(navigate).toHaveBeenCalledWith({
      params: { country: 'us', locale: 'en' },
      search: expect.objectContaining({ q: 'air' }),
      to: '/$country/$locale/products',
    })
  })

  it('clears the current query when a preview product is selected', async () => {
    searchPreviewProducts.push({
      description: 'Quiet air purifier.',
      id: 'product-air-purifier',
      image: null,
      inStock: true,
      name: 'Air Purifier',
      price: { amount: 120, currencyCode: 'USD' },
      slug: 'air-purifier',
    })
    const onOpenChange = vi.fn()
    const props: ComponentProps<typeof SearchDrawer> = {
      categories: [],
      handle: {} as ComponentProps<typeof SearchDrawer>['handle'],
      onOpenChange,
      open: true,
      triggerId: 'search-trigger',
    }

    render(<SearchDrawer {...props} />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    fireEvent.change(input, { target: { value: 'air' } })

    const productLink = await screen.findByRole('link', {
      name: /Air Purifier/,
    })
    fireEvent.click(productLink)

    expect(input).toHaveProperty('value', '')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
