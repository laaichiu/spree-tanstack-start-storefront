import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { ProductSummary, ProductVariant } from '@/lib/catalog/contracts'

import { CatalogProductCard } from './catalog-product-card'

const price = { amount: 24, currencyCode: 'USD' }

function variant(id: string, label: string): ProductVariant {
  return {
    backorderable: false,
    id,
    inStock: true,
    optionValues: [
      {
        colorCode: '#111111',
        id: `color-${id}`,
        imageUrl: null,
        label,
        name: label,
        optionTypeId: 'option-color',
        optionTypeLabel: 'Color',
        optionTypeName: 'Color',
      },
    ],
    preorder: false,
    preorderShipsAt: null,
    price,
    sku: id.toUpperCase(),
  }
}

function product(
  variants: ProductVariant[],
  brand: ProductSummary['brand'] = null,
): ProductSummary {
  return {
    brand,
    backorderable: false,
    defaultVariantId: variants.at(-1)?.id ?? null,
    description: 'A useful bowl.',
    id: 'product-1',
    image: null,
    inStock: true,
    name: 'Everyday Bowl',
    price,
    preorder: false,
    purchasable: true,
    slug: 'everyday-bowl',
    variants,
  }
}

afterEach(cleanup)

describe('CatalogProductCard', () => {
  it('renders an optional catalog attribution above the product name', () => {
    render(
      <CatalogProductCard
        attribution="Apple"
        labels={{
          discount: (percent) => `${percent}% off`,
          imageFallback: 'Image unavailable',
          outOfStock: 'Out of stock',
          preorder: 'Preorder',
        }}
        locale="en-US"
        product={product([variant('variant-default', 'Default')])}
        renderProductLink={(content) => content}
        variant="listing"
      />,
    )

    expect(screen.getByText('Apple')).toBeTruthy()
  })

  it('uses the product brand when no explicit attribution is provided', () => {
    render(
      <CatalogProductCard
        labels={{
          discount: (percent) => `${percent}% off`,
          imageFallback: 'Image unavailable',
          outOfStock: 'Out of stock',
          preorder: 'Preorder',
        }}
        locale="en-US"
        product={product([variant('variant-default', 'Default')], {
          id: 'seller-apple',
          name: 'Apple',
          slug: 'apple',
        })}
        renderProductLink={(content) => content}
        variant="listing"
      />,
    )

    expect(screen.getByText('Apple')).toBeTruthy()
  })

  it('clears a selected variant that leaves the refreshed product', async () => {
    const blueVariant = variant('variant-blue', 'Blue')
    const redVariant = variant('variant-red', 'Red')
    const { rerender } = render(
      <CatalogProductCard
        labels={{
          discount: (percent) => `${percent}% off`,
          imageFallback: 'Image unavailable',
          outOfStock: 'Out of stock',
          preorder: 'Preorder',
        }}
        locale="en-US"
        product={product([blueVariant, redVariant])}
        renderProductLink={(content) => content}
        variant="listing"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Blue' }))
    expect(
      screen.getByRole('button', { name: 'Blue' }).getAttribute('aria-pressed'),
    ).toBe('true')

    rerender(
      <CatalogProductCard
        labels={{
          discount: (percent) => `${percent}% off`,
          imageFallback: 'Image unavailable',
          outOfStock: 'Out of stock',
          preorder: 'Preorder',
        }}
        locale="en-US"
        product={product([redVariant])}
        renderProductLink={(content) => content}
        variant="listing"
      />,
    )

    await waitFor(() => {
      expect(
        screen
          .getByRole('button', { name: 'Red' })
          .getAttribute('aria-pressed'),
      ).toBe('true')
    })
  })
})
