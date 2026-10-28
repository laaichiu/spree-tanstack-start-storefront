// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { Product } from '@/lib/catalog/contracts'

import { buildProductStructuredData } from './catalog-seo'

const product = {
  categoryBreadcrumbs: [],
  compareAtPrice: null,
  defaultVariantId: 'variant-default',
  description: 'A useful bowl.',
  descriptionHtml: '<p>A useful bowl.</p>',
  id: 'prod_bowl',
  images: [],
  inStock: true,
  metaDescription: 'A useful bowl.',
  metaTitle: null,
  name: 'Everyday Bowl',
  options: [],
  preorder: false,
  preorderShipsAt: null,
  price: { amount: 24, currencyCode: 'USD' },
  purchasable: true,
  specifications: [],
  slug: 'everyday-bowl',
  variantCount: 1,
  variants: [
    {
      backorderable: false,
      id: 'variant-default',
      inStock: true,
      optionValues: [],
      preorder: false,
      preorderShipsAt: null,
      price: null,
      purchasable: true,
      sku: 'BOWL-DEFAULT',
    },
  ],
} satisfies Product

describe('catalog product structured data', () => {
  it('does not fall back to the product price for an unpriced default variant', () => {
    const structuredData = buildProductStructuredData({
      canonicalUrl: 'https://example.com/us/en/products/everyday-bowl',
      product,
    })

    expect(structuredData.offers).toMatchObject({
      availability: 'https://schema.org/InStock',
      url: 'https://example.com/us/en/products/everyday-bowl',
    })
    expect(structuredData.offers).not.toHaveProperty('price')
    expect(structuredData.offers).not.toHaveProperty('priceCurrency')
  })

  it('uses a representative variant only when no default variant is declared', () => {
    const structuredData = buildProductStructuredData({
      canonicalUrl: 'https://example.com/us/en/products/everyday-bowl',
      product: {
        ...product,
        defaultVariantId: null,
        price: { amount: 24, currencyCode: 'USD' },
        variants: [
          {
            ...product.variants[0],
            id: 'variant-representative',
            price: { amount: 20, currencyCode: 'USD' },
          },
        ],
      },
    })

    expect(structuredData.offers).toMatchObject({
      price: 20,
      priceCurrency: 'USD',
    })
  })
})
