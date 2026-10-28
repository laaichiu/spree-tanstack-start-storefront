import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CatalogProductReference } from '@/lib/catalog/contracts'
import { HomeFeaturedProductsView } from './home-featured-products-view'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const labels = {
  emptyDescription: 'New products are on the way.',
  emptyTitle: 'No products yet',
  errorDescription: 'Try again in a moment.',
  errorTitle: 'Products are unavailable',
  nextLabel: 'Next products',
  previousLabel: 'Previous products',
  title: 'New in',
  viewAll: 'View all',
}

const products: CatalogProductReference[] = [
  { id: 'product-1', name: 'Linen shirt', slug: 'linen-shirt' },
]

function renderProductLink(
  product: CatalogProductReference,
  content: ReactNode,
  className?: string,
) {
  return (
    <a className={className} href={`/products/${product.slug}`}>
      {content}
    </a>
  )
}

function renderProductsLink(content: ReactNode, className?: string) {
  return (
    <a className={className} href="/products">
      {content}
    </a>
  )
}

describe('HomeFeaturedProductsView', () => {
  it('presents ready, empty and error product states', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(
      <HomeFeaturedProductsView
        labels={labels}
        products={products}
        renderProductCard={({ product, renderProductLink: renderCardLink }) =>
          renderCardLink(<span>{product.name}</span>)
        }
        renderProductLink={renderProductLink}
        renderProductsLink={renderProductsLink}
        status="ready"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'New in' }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'View all' })).toHaveProperty(
      'pathname',
      '/products',
    )
    expect(screen.getAllByRole('link', { name: 'Linen shirt' })).toHaveLength(2)
    expect(
      consoleError.mock.calls.some((call) =>
        call.some(
          (value) =>
            typeof value === 'string' &&
            value.includes('children with the same key'),
        ),
      ),
    ).toBe(false)

    rerender(
      <HomeFeaturedProductsView
        labels={labels}
        products={[]}
        renderProductCard={() => null}
        renderProductLink={renderProductLink}
        renderProductsLink={renderProductsLink}
        status="empty"
      />,
    )
    expect(screen.getByText('No products yet')).toBeTruthy()
    expect(screen.getByText('New products are on the way.')).toBeTruthy()

    rerender(
      <HomeFeaturedProductsView
        labels={labels}
        products={[]}
        renderProductCard={() => null}
        renderProductLink={renderProductLink}
        renderProductsLink={renderProductsLink}
        status="error"
      />,
    )
    expect(screen.getByText('Products are unavailable')).toBeTruthy()
    expect(screen.getByText('Try again in a moment.')).toBeTruthy()
  })
})
