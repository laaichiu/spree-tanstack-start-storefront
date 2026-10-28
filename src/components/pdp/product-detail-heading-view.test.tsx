import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ProductDetailHeadingView } from './product-detail-heading-view'

afterEach(cleanup)

describe('ProductDetailHeadingView', () => {
  it('renders canonical breadcrumb data through the supplied link renderer', () => {
    render(
      <ProductDetailHeadingView
        breadcrumbs={[
          { id: 'home', label: 'Home' },
          { id: 'shoes', isCurrent: true, label: 'Shoes' },
        ]}
        model={{
          brand: null,
          breadcrumbLabel: 'Breadcrumbs',
          price: {
            compareAtPriceLabel: null,
            priceLabel: '$120.00',
          },
          productName: 'Trail Runner',
          reviewAnchor: null,
        }}
        renderBreadcrumb={(breadcrumb, props) => (
          <a href={`/category/${breadcrumb.id}`} {...props}>
            {props.children}
          </a>
        )}
      />,
    )

    expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveProperty(
      'pathname',
      '/category/home',
    )
    expect(screen.getByRole('link', { name: 'Shoes' })).toHaveProperty(
      'pathname',
      '/category/shoes',
    )
    expect(screen.getByRole('heading', { name: 'Trail Runner' })).toBeTruthy()
    expect(screen.getByText('$120.00')).toBeTruthy()
  })

  it('renders a linked brand eyebrow above the product title when present', () => {
    render(
      <ProductDetailHeadingView
        breadcrumbs={[{ id: 'home', label: 'Home' }]}
        model={{
          brand: { name: 'Apple', slug: 'apple' },
          breadcrumbLabel: 'Breadcrumbs',
          price: { compareAtPriceLabel: null, priceLabel: '$199.99' },
          productName: 'AirPods',
          reviewAnchor: null,
        }}
        renderBrand={(brand, props) => (
          <a href={`/brands/${brand.slug}`} {...props}>
            {props.children}
          </a>
        )}
        renderBreadcrumb={(_breadcrumb, props) => (
          <a href="/" {...props}>
            {props.children}
          </a>
        )}
      />,
    )

    expect(screen.getByRole('link', { name: 'Apple' })).toHaveProperty(
      'pathname',
      '/brands/apple',
    )
    expect(screen.getByRole('heading', { name: 'AirPods' })).toBeTruthy()
  })

  it('can render the title block without duplicating breadcrumbs', () => {
    render(
      <ProductDetailHeadingView
        breadcrumbs={[{ id: 'home', label: 'Home' }]}
        model={{
          brand: null,
          breadcrumbLabel: 'Breadcrumbs',
          price: { compareAtPriceLabel: null, priceLabel: '$120.00' },
          productName: 'Trail Runner',
          reviewAnchor: null,
        }}
        renderBreadcrumb={(_breadcrumb, props) => (
          <a href="/" {...props}>
            {props.children}
          </a>
        )}
        showBreadcrumbs={false}
      />,
    )

    expect(screen.queryByRole('navigation', { name: 'Breadcrumbs' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Trail Runner' })).toBeTruthy()
  })
})
