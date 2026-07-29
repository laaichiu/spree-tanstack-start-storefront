import { describe, expect, it } from 'vitest'

import type { ProductImage } from '../model/product'
import { mergeProductImages } from './product-media.mapper'

describe('mergeProductImages', () => {
  it('preserves variant associations when the same source is returned twice', () => {
    const images: ProductImage[] = [
      {
        alt: 'Product image',
        id: 'media-1',
        src: 'https://example.com/product.jpg',
        variantIds: [],
      },
      {
        alt: 'Variant image',
        id: 'media-2',
        src: 'https://example.com/product.jpg',
        variantIds: ['variant-blue'],
      },
    ]

    expect(mergeProductImages(images)).toEqual([
      {
        alt: 'Product image',
        id: 'media-1',
        src: 'https://example.com/product.jpg',
        variantIds: ['variant-blue'],
      },
    ])
  })
})
