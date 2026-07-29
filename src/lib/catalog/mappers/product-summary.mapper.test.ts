import { describe, expect, it } from 'vitest'

import { baseProduct } from './product.mapper.fixture'
import { mapSpreeProductToSummary } from './product.mapper'

describe('mapSpreeProductToSummary', () => {
  it('maps a Spree product into the storefront product summary model', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      primary_media: {
        id: 'media-1',
        product_id: 'product-1',
        variant_ids: [],
        position: 1,
        alt: 'Stoneware bowl on a table',
        media_type: 'image',
        focal_point_x: null,
        focal_point_y: null,
        external_video_url: null,
        original_url: 'https://example.com/original.jpg',
        mini_url: null,
        small_url: null,
        medium_url: 'https://example.com/medium.jpg',
        large_url: 'https://example.com/large.jpg',
        xlarge_url: null,
        og_image_url: null,
      },
    })

    expect(summary).toEqual({
      id: 'product-1',
      slug: 'everyday-bowl',
      name: 'Everyday Bowl',
      description: 'A useful bowl.',
      price: {
        amount: 24,
        currencyCode: 'USD',
      },
      compareAtPrice: undefined,
      image: {
        id: 'media-1',
        src: 'https://example.com/large.jpg',
        alt: 'Stoneware bowl on a table',
        variantIds: [],
      },
      inStock: true,
      preorder: false,
    })
  })

  it('falls back to thumbnail image and product name alt text', () => {
    const summary = mapSpreeProductToSummary(baseProduct)

    expect(summary.image).toEqual({
      id: 'product-1:thumbnail',
      src: 'https://example.com/thumb.jpg',
      alt: 'Everyday Bowl',
      variantIds: [],
    })
  })

  it('does not mark an unpurchasable product as in stock for UI purposes', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      purchasable: false,
      in_stock: true,
    })

    expect(summary.inStock).toBe(false)
  })

  it('preserves an unavailable Spree price as null', () => {
    expect(
      mapSpreeProductToSummary({
        ...baseProduct,
        price: {
          ...baseProduct.price,
          amount_in_cents: null,
        },
      }).price,
    ).toBeNull()
  })
})
