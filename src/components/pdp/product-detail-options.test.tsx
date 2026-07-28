import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Product } from '@/lib/catalog/model/product'

import { ProductDetailOptions } from './product-detail-options'

afterEach(cleanup)

const product = {
  categoryBreadcrumbs: [],
  id: 'product-1',
  slug: 'travel-hair-dryer',
  name: 'Compact Travel Hair Dryer',
  description: '',
  descriptionHtml: '',
  metaDescription: '',
  price: { amount: 34.99, currencyCode: 'USD' },
  defaultVariantId: 'variant-pink',
  images: [],
  inStock: true,
  options: [
    {
      id: 'option-type-color',
      name: 'color',
      label: 'Color',
      values: [
        {
          id: 'option-value-pink',
          name: 'pink',
          label: 'Pink',
          colorCode: '#f46565',
          imageUrl: null,
        },
      ],
    },
  ],
  purchasable: true,
  specifications: [],
  variants: [
    {
      id: 'variant-pink',
      sku: 'TRAVEL-HAIR-DRYER-PINK',
      price: { amount: 34.99, currencyCode: 'USD' },
      inStock: true,
      optionValues: [
        {
          id: 'option-value-pink',
          name: 'pink',
          label: 'Pink',
          colorCode: '#f46565',
          imageUrl: null,
          optionTypeId: 'option-type-color',
          optionTypeName: 'color',
          optionTypeLabel: 'Color',
        },
      ],
    },
  ],
  variantCount: 1,
} satisfies Product

describe('ProductDetailOptions', () => {
  it('renders the configured color code instead of the label fallback', () => {
    render(
      <ProductDetailOptions
        onSelectOption={vi.fn()}
        product={product}
        selectedOptions={{ 'option-type-color': 'option-value-pink' }}
      />,
    )

    const swatch = screen
      .getByRole('button', { name: 'Pink' })
      .querySelector<HTMLElement>('span[aria-hidden="true"]')

    expect(swatch?.style.backgroundColor).toBe('rgb(244, 101, 101)')
    expect(swatch?.className).not.toContain('bg-muted')
  })
})
