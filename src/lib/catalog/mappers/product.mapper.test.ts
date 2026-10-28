// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type {
  Category as SpreeCategory,
  Media as SpreeMedia,
  Variant as SpreeVariant,
} from '@spree/sdk'

import { baseProduct } from './product.mapper.fixture'
import { categoryResource } from '../utils/catalog-category-response.test-support'
import {
  mapSpreeProductToProduct,
  mapSpreeProductToSummary,
} from './product.mapper'

function variant(overrides: Partial<SpreeVariant> = {}): SpreeVariant {
  const baseVariant: SpreeVariant = {
    backorderable: false,
    depth: null,
    height: null,
    id: 'variant-blue',
    in_stock: true,
    media_count: 0,
    option_values: [],
    options_text: 'Color: Blue',
    original_price: null,
    preorder: false,
    preorder_ships_at: null,
    price: baseProduct.price,
    product_id: baseProduct.id,
    purchasable: true,
    sku: 'BOWL-BLUE',
    thumbnail_url: null,
    track_inventory: true,
    weight: null,
    weight_unit: 'kg',
    dimensions_unit: 'cm',
    minimum_order_quantity: 1,
    order_multiple: 1,
    purchase_unit: 'unit',
    seller_id: null,
    units_per_carton: null,
    width: null,
  }

  return {
    ...baseVariant,
    ...overrides,
    original_price: overrides.original_price ?? baseVariant.original_price,
  }
}

function media(overrides: Partial<SpreeMedia> = {}): SpreeMedia {
  return {
    alt: null,
    external_video_url: null,
    focal_point_x: null,
    focal_point_y: null,
    id: 'media-1',
    large_url: 'https://example.com/media-1.jpg',
    media_type: 'image',
    medium_url: 'https://example.com/media-1-medium.jpg',
    mini_url: null,
    og_image_url: null,
    original_url: 'https://example.com/media-1-original.jpg',
    position: 1,
    product_id: baseProduct.id,
    small_url: 'https://example.com/media-1-small.jpg',
    variant_ids: [],
    xlarge_url: null,
    video_provider: null,
    video_embed_url: null,
    video_url: null,
    poster_url: null,
    ...overrides,
  }
}

function category(overrides: Record<string, unknown> = {}): SpreeCategory {
  return categoryResource(overrides)
}

describe('catalog product mapping', () => {
  it('builds breadcrumbs from the deepest parent-owned category', () => {
    const root = category({
      id: 'ctg_root',
      name: 'Root',
      parent_id: null,
      permalink: 'root',
    })
    const shallow = category({
      depth: 1,
      id: 'ctg_shallow',
      is_root: false,
      name: 'Shallow',
      parent_id: 'ctg_root',
      permalink: 'root/shallow',
    })
    const deep = category({
      ancestors: [root, shallow],
      depth: 2,
      id: 'ctg_deep',
      is_root: true,
      name: 'Deep',
      parent_id: 'ctg_shallow',
      permalink: 'root/shallow/deep',
    })

    const product = mapSpreeProductToProduct({
      ...baseProduct,
      categories: [deep, shallow, root],
    })

    expect(product.categoryBreadcrumbs.map(({ id }) => id)).toEqual([
      'ctg_root',
      'ctg_shallow',
      'ctg_deep',
    ])
  })

  it('normalizes nullable product detail fields and sanitizes rich text', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      description_html:
        '<p>Safe <strong>content</strong></p><script>alert(1)</script><a href="javascript:alert(1)">Unsafe</a>',
      meta_description: null,
      variants: [
        variant({
          option_values: [
            {
              color_code: '#345b82',
              id: 'option-value-blue',
              image_url: null,
              label: 'Blue',
              name: 'blue',
              option_type_id: 'option-type-color',
              option_type_label: 'Color',
              option_type_name: 'color',
              position: 1,
            },
          ],
          preorder: true,
          preorder_ships_at: '2026-10-01',
          purchasable: true,
          in_stock: false,
        }),
      ],
    })

    expect(product.descriptionHtml).toBe(
      '<p>Safe <strong>content</strong></p><a>Unsafe</a>',
    )
    expect(product.metaDescription).toBe(baseProduct.description)
    expect(product.options).toEqual([
      {
        id: 'option-type-color',
        label: 'Color',
        name: 'color',
        values: [
          {
            colorCode: '#345b82',
            id: 'option-value-blue',
            imageUrl: null,
            label: 'Blue',
            name: 'blue',
          },
        ],
      },
    ])
    expect(product.variants[0]).toMatchObject({
      backorderable: false,
      inStock: false,
      preorder: true,
      preorderShipsAt: '2026-10-01',
      purchasable: true,
    })
  })

  it('maps an expanded public seller to the product brand reference', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      seller_id: 'seller_apple',
      seller: {
        about: 'Apple seller profile',
        about_html: '<p>Apple seller profile</p>',
        cover_photo_url: null,
        id: 'seller_apple',
        logo_url: null,
        name: 'Apple',
        slug: 'apple',
        square_logo_url: null,
      },
    })

    expect(product.brand).toEqual({
      id: 'seller_apple',
      name: 'Apple',
      slug: 'apple',
    })
  })

  it('keeps all expanded media from a variant in the product gallery', () => {
    const productGalleryImage = media({
      id: 'media-product',
      large_url: 'https://example.com/product.jpg',
    })
    const variantPrimaryImage = media({
      id: 'media-variant-primary',
      large_url: 'https://example.com/variant-primary.jpg',
      variant_ids: ['variant-blue'],
    })
    const variantDetailImage = media({
      id: 'media-variant-detail',
      large_url: 'https://example.com/variant-detail.jpg',
      variant_ids: ['variant-blue'],
    })

    const mappedProduct = mapSpreeProductToProduct({
      ...baseProduct,
      media: [productGalleryImage],
      primary_media: productGalleryImage,
      variants: [
        variant({
          id: 'variant-blue',
          media: [variantPrimaryImage, variantDetailImage],
          primary_media: variantPrimaryImage,
        }),
      ],
    })

    expect(mappedProduct.images.map((image) => image.src)).toEqual([
      'https://example.com/product.jpg',
      'https://example.com/variant-primary.jpg',
      'https://example.com/variant-detail.jpg',
    ])
    expect(mappedProduct.images[2]?.variantIds).toEqual(['variant-blue'])
  })

  it('uses expanded default-variant commerce data for product summaries', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      default_variant: variant({
        id: baseProduct.default_variant_id,
        in_stock: false,
        preorder: true,
        preorder_ships_at: '2026-10-01',
        price: {
          ...baseProduct.price,
          amount: '20.00',
          amount_in_cents: 2000,
        },
        original_price: {
          ...baseProduct.price,
          amount: '25.00',
          amount_in_cents: 2500,
        },
        purchasable: true,
        thumbnail_url: 'https://example.com/blue.jpg',
      }),
    })

    expect(summary).toMatchObject({
      compareAtPrice: { amount: 25, currencyCode: 'USD' },
      defaultVariantId: baseProduct.default_variant_id,
      image: {
        alt: 'Color: Blue',
        src: 'https://example.com/blue.jpg',
        variantIds: [baseProduct.default_variant_id],
      },
      inStock: false,
      preorder: true,
      price: { amount: 20, currencyCode: 'USD' },
      purchasable: true,
    })
  })

  it('maps an expanded public seller to the product summary brand reference', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      seller_id: 'seller_apple',
      seller: {
        about: 'Apple seller profile',
        about_html: '<p>Apple seller profile</p>',
        cover_photo_url: null,
        id: 'seller_apple',
        logo_url: null,
        name: 'Apple',
        slug: 'apple',
        square_logo_url: null,
      },
    })

    expect(summary.brand).toEqual({
      id: 'seller_apple',
      name: 'Apple',
      slug: 'apple',
    })
  })

  it('preserves unavailable prices instead of treating them as zero', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      price: { ...baseProduct.price, amount: null, amount_in_cents: null },
      thumbnail_url: null,
    })

    expect(summary.price).toBeNull()
    expect(summary.image).toBeNull()
  })
})
