import { describe, expect, it } from 'vitest'

import type { ProductSummary } from '../model/product'
import { selectRelatedProductSummaries } from './related-products'

function product(id: string): ProductSummary {
  return {
    description: '',
    id,
    image: null,
    inStock: true,
    preorder: false,
    name: id,
    price: { amount: 100, currencyCode: 'USD' },
    slug: id,
  }
}

describe('selectRelatedProductSummaries', () => {
  it('excludes the current product before applying the display limit', () => {
    const products = ['current', 'one', 'two', 'three', 'four'].map(product)

    expect(
      selectRelatedProductSummaries({
        currentProductId: 'current',
        limit: 4,
        products,
      }).map((relatedProduct) => relatedProduct.id),
    ).toEqual(['one', 'two', 'three', 'four'])
  })
})
