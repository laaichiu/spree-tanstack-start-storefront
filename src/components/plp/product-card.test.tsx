import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { ProductSummary } from '@/lib/catalog/model/product'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { ProductCard } from './product-card'

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

const saleProduct = {
  compareAtPrice: { amount: 68, currencyCode: 'USD' },
  defaultVariantId: 'variant-red',
  description: 'A useful tee.',
  id: 'product-tee',
  image: {
    alt: 'Everyday Tee in blue',
    id: 'product-image',
    src: '/product.jpg',
    variantIds: [],
  },
  inStock: true,
  name: 'Everyday Tee',
  preorder: false,
  price: { amount: 51, currencyCode: 'USD' },
  slug: 'everyday-tee',
  variants: [
    {
      compareAtPrice: { amount: 68, currencyCode: 'USD' },
      id: 'variant-blue',
      image: {
        alt: 'Everyday Tee in blue',
        id: 'variant-blue-image',
        src: '/blue.jpg',
        variantIds: ['variant-blue'],
      },
      inStock: true,
      optionValues: [
        {
          colorCode: '#345b82',
          id: 'color-blue',
          imageUrl: null,
          label: 'Blue',
          name: 'blue',
          optionTypeId: 'option-color',
          optionTypeLabel: 'Color',
          optionTypeName: 'color',
        },
      ],
      preorder: false,
      preorderShipsAt: null,
      price: { amount: 51, currencyCode: 'USD' },
      sku: 'TEE-BLUE',
    },
    {
      compareAtPrice: { amount: 50, currencyCode: 'USD' },
      id: 'variant-red',
      image: {
        alt: 'Everyday Tee in red',
        id: 'variant-red-image',
        src: '/red.jpg',
        variantIds: ['variant-red'],
      },
      inStock: true,
      optionValues: [
        {
          colorCode: '#ad3b3b',
          id: 'color-red',
          imageUrl: null,
          label: 'Red',
          name: 'red',
          optionTypeId: 'option-color',
          optionTypeLabel: 'Color',
          optionTypeName: 'color',
        },
      ],
      preorder: true,
      preorderShipsAt: null,
      price: { amount: 40, currencyCode: 'USD' },
      sku: 'TEE-RED',
    },
    {
      compareAtPrice: null,
      id: 'variant-green',
      image: {
        alt: 'Everyday Tee in green',
        id: 'variant-green-image',
        src: '/green.jpg',
        variantIds: ['variant-green'],
      },
      inStock: true,
      optionValues: [
        {
          colorCode: '#52704e',
          id: 'color-green',
          imageUrl: null,
          label: 'Green',
          name: 'green',
          optionTypeId: 'option-color',
          optionTypeLabel: 'Color',
          optionTypeName: 'color',
        },
      ],
      preorder: true,
      preorderShipsAt: '2026-10-01',
      price: { amount: 43, currencyCode: 'USD' },
      sku: 'TEE-GREEN',
    },
  ],
} satisfies ProductSummary

afterEach(cleanup)

describe('ProductCard', () => {
  it('shows the default variant sale state and color swatches', () => {
    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <ProductCard product={saleProduct} variant="listing" />
      </MarketProvider>,
    )

    expect(screen.getByLabelText('25% OFF')).toBeTruthy()
    expect(screen.queryByLabelText('Pre-order')).toBeNull()
    expect(screen.getByText('$51.00')).toBeTruthy()
    expect(screen.getByText('$68.00')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Blue' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Red' })).toBeTruthy()
    expect(
      screen.getByRole('img', { name: 'Everyday Tee in blue' }),
    ).toHaveProperty('src', expect.stringContaining('/blue.jpg'))
  })

  it('hides variant swatches on the default home card', () => {
    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <ProductCard product={saleProduct} />
      </MarketProvider>,
    )

    expect(screen.getByLabelText('25% OFF')).toBeTruthy()
    expect(screen.getByText('$51.00')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Blue' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Red' })).toBeNull()
    expect(screen.queryByLabelText('Product colors')).toBeNull()
  })

  it('switches image, price, compare-at price, and badge for a hovered color', () => {
    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <ProductCard product={saleProduct} variant="listing" />
      </MarketProvider>,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Red' }))

    expect(
      screen.getByRole('img', { name: 'Everyday Tee in red' }),
    ).toHaveProperty('src', expect.stringContaining('/red.jpg'))
    expect(screen.getByText('$40.00')).toBeTruthy()
    expect(screen.getByText('$50.00')).toBeTruthy()
    expect(screen.getByLabelText('20% OFF')).toBeTruthy()
    expect(screen.getByLabelText('Pre-order')).toBeTruthy()
    expect(screen.queryByLabelText('25% OFF')).toBeNull()
  })

  it('shows pre-order at the badge position when the active color is not on sale', () => {
    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <ProductCard product={saleProduct} variant="listing" />
      </MarketProvider>,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Green' }))

    expect(screen.getByText('$43.00')).toBeTruthy()
    expect(screen.getByLabelText('Pre-order')).toBeTruthy()
    expect(screen.queryByLabelText('25% OFF')).toBeNull()
  })

  it('keeps the last color variant after the pointer leaves the swatches', () => {
    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <ProductCard product={saleProduct} variant="listing" />
      </MarketProvider>,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Red' }))
    fireEvent.mouseLeave(screen.getByLabelText('Product colors'))

    expect(
      screen.getByRole('img', { name: 'Everyday Tee in red' }),
    ).toHaveProperty('src', expect.stringContaining('/red.jpg'))
    expect(screen.getByText('$40.00')).toBeTruthy()
    expect(screen.getByLabelText('20% OFF')).toBeTruthy()
  })
})
