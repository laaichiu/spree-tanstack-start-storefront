import { describe, expect, it } from 'vitest'

import type { ProductImage } from '../model/product'
import { mapSpreeMediaSrcSet, mergeProductImages } from './product-media.mapper'

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

describe('mapSpreeMediaSrcSet', () => {
  it('bounds listing image candidates at the large Spree variant', () => {
    expect(
      mapSpreeMediaSrcSet({
        mini_url: 'https://example.com/mini.jpg',
        small_url: 'https://example.com/small.jpg',
        medium_url: 'https://example.com/medium.jpg',
        large_url: 'https://example.com/large.jpg',
      }),
    ).toBe(
      'https://example.com/mini.jpg 128w, https://example.com/small.jpg 256w, https://example.com/medium.jpg 400w, https://example.com/large.jpg 720w',
    )
  })
})
