import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import type { CatalogProductReference } from '@/lib/catalog/contracts'
import { HomeFeaturedProductsView } from './home-featured-products-view'

afterEach(cleanup)

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

function getProducts(prefix: string): CatalogProductReference[] {
  return Array.from({ length: 7 }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    name: `${prefix} product ${index + 1}`,
    slug: `${prefix}-product-${index + 1}`,
  }))
}

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

function renderFeaturedProducts(products: CatalogProductReference[]) {
  return (
    <HomeFeaturedProductsView
      labels={labels}
      products={products}
      renderProductCard={({ product, renderProductLink: renderCardLink }) =>
        renderCardLink(<span>{product.name}</span>)
      }
      renderProductLink={renderProductLink}
      renderProductsLink={renderProductsLink}
      status="ready"
    />
  )
}

describe('Home featured-products carousel collection ownership', () => {
  it('remounts desktop pagination when the product collection changes', () => {
    const { rerender } = render(renderFeaturedProducts(getProducts('first')))

    fireEvent.click(screen.getByRole('button', { name: 'Next products' }))
    expect(screen.getAllByText('first product 7')).toHaveLength(2)

    rerender(renderFeaturedProducts(getProducts('second')))

    expect(screen.getAllByText('second product 1')).toHaveLength(2)
  })
})
