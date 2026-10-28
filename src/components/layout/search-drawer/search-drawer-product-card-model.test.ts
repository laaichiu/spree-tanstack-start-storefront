// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { ProductSummary } from '@/lib/catalog/contracts'
import { getSearchProductCardModel } from './search-drawer-product-card-model'

const product = {
  brand: {
    id: 'seller-apple',
    name: 'Apple',
    slug: 'apple',
  },
  defaultVariantId: 'variant-1',
  description: 'A product.',
  id: 'product-1',
  image: null,
  inStock: true,
  name: 'AirPods Verification',
  price: { amount: 199.99, currencyCode: 'USD' },
  preorder: false,
  slug: 'airpods-verification',
  variants: [],
} satisfies ProductSummary

describe('search product card model', () => {
  it('includes the product brand as card attribution', () => {
    expect(getSearchProductCardModel(product, 'en-US')).toMatchObject({
      attribution: 'Apple',
      name: 'AirPods Verification',
    })
  })

  it('omits attribution for first-party products', () => {
    expect(
      getSearchProductCardModel({ ...product, brand: null }, 'en-US'),
    ).toMatchObject({ attribution: null })
  })
})
