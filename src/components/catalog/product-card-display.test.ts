// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { ProductSummary, ProductVariant } from '@/lib/catalog/contracts'
import {
  getInitialProductVariantId,
  getProductCardDisplay,
} from './product-card-display'

const price = { amount: 24, currencyCode: 'USD' }

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    backorderable: false,
    id: 'variant-blue',
    inStock: true,
    optionValues: [],
    preorder: false,
    preorderShipsAt: null,
    price,
    sku: 'BLUE',
    ...overrides,
  }
}

const product = {
  defaultVariantId: 'variant-blue',
  description: 'A useful bowl.',
  id: 'product-1',
  image: null,
  inStock: true,
  name: 'Everyday Bowl',
  price,
  preorder: false,
  slug: 'everyday-bowl',
  variants: [variant()],
} satisfies ProductSummary

describe('catalog product card display', () => {
  it('initializes to the API-declared default variant', () => {
    const defaultVariant = variant({ id: 'variant-default' })
    const productWithOrderedVariants = {
      ...product,
      defaultVariantId: defaultVariant.id,
      variants: [product.variants[0], defaultVariant],
    }

    expect(getInitialProductVariantId(productWithOrderedVariants)).toBe(
      defaultVariant.id,
    )
  })

  it('keeps an unpriced selected variant unavailable without product fallback', () => {
    const unpricedVariant = variant({
      compareAtPrice: null,
      id: 'variant-unpriced',
      price: null,
    })
    const unpricedProduct = {
      ...product,
      variants: [unpricedVariant],
    }

    expect(
      getProductCardDisplay(unpricedProduct, unpricedVariant.id),
    ).toMatchObject({
      compareAtPrice: null,
      discountPercent: null,
      price: null,
      purchasable: false,
      variant: unpricedVariant,
    })
  })

  it('keeps a missing selected variant unavailable without product fallback', () => {
    const productWithOffer = {
      ...product,
      compareAtPrice: { amount: 30, currencyCode: 'USD' },
      preorder: true,
    }

    expect(
      getProductCardDisplay(productWithOffer, 'variant-no-longer-available'),
    ).toMatchObject({
      compareAtPrice: null,
      discountPercent: null,
      preorder: false,
      price: null,
      purchasable: false,
      variant: null,
    })
  })

  it('requires a product price for product-level card purchasability', () => {
    const unpricedProduct = {
      ...product,
      price: null,
      purchasable: true,
    }

    expect(getProductCardDisplay(unpricedProduct, null)).toMatchObject({
      price: null,
      purchasable: false,
      variant: null,
    })
  })
})
