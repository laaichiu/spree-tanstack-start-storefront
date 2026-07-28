import type { Product as SpreeProduct } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import {
  mapSpreeProductToProduct,
  mapSpreeProductToSummary,
} from './product.mapper'

const baseProduct = {
  id: 'product-1',
  name: 'Everyday Bowl',
  slug: 'everyday-bowl',
  meta_description: null,
  meta_keywords: null,
  variant_count: 1,
  available_on: '2026-01-01',
  purchasable: true,
  in_stock: true,
  backorderable: false,
  available: true,
  description: 'A useful bowl.',
  description_html: '<p>A useful bowl.</p>',
  default_variant_id: 'variant-1',
  thumbnail_url: 'https://example.com/thumb.jpg',
  tags: [],
  price: {
    id: 'price-1',
    amount: '24.00',
    amount_in_cents: 2400,
    compare_at_amount: null,
    compare_at_amount_in_cents: null,
    currency: 'USD',
    display_amount: '$24.00',
    display_compare_at_amount: null,
    price_list_id: null,
  },
  original_price: null,
} satisfies SpreeProduct

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

  it('maps a Spree product into the storefront product detail model', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      meta_description: 'A concise bowl description.',
      original_price: {
        ...baseProduct.price,
        id: 'price-compare',
        amount: '32.00',
        amount_in_cents: 3200,
      },
      media: [
        {
          id: 'media-1',
          product_id: 'product-1',
          variant_ids: ['variant-1'],
          position: 1,
          alt: 'Bowl angle one',
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
      ],
      categories: [
        {
          ancestors: [
            {
              children_count: 1,
              depth: 0,
              description: '',
              description_html: '',
              id: 'root-1',
              image_url: null,
              is_child: false,
              is_leaf: false,
              is_root: true,
              meta_description: null,
              meta_keywords: null,
              meta_title: null,
              name: 'Categories',
              parent_id: null,
              permalink: 'categories',
              position: 1,
              square_image_url: null,
            },
            {
              children_count: 1,
              depth: 1,
              description: '',
              description_html: '',
              id: 'parent-1',
              image_url: null,
              is_child: true,
              is_leaf: false,
              is_root: true,
              meta_description: null,
              meta_keywords: null,
              meta_title: null,
              name: 'Kitchen',
              parent_id: 'root-1',
              permalink: 'kitchen',
              position: 1,
              square_image_url: null,
            },
          ],
          children_count: 0,
          depth: 2,
          description: '',
          description_html: '',
          id: 'category-1',
          image_url: null,
          is_child: true,
          is_leaf: true,
          is_root: false,
          meta_description: null,
          meta_keywords: null,
          meta_title: null,
          name: 'Coffee Machines',
          parent_id: 'parent-1',
          permalink: 'kitchen/coffee-machines',
          position: 1,
          square_image_url: null,
        },
      ],
      custom_fields: [
        {
          id: 'field-1',
          key: 'custom.warranty',
          label: 'Warranty',
          type: 'Spree::Metafields::ShortText',
          value: '2 Years',
        },
        {
          id: 'field-2',
          key: 'custom.capacity',
          label: 'Capacity',
          type: 'Spree::Metafields::ShortText',
          value: '1.5L',
        },
      ],
    })

    expect(product).toEqual({
      categoryBreadcrumbs: [
        {
          id: 'parent-1',
          name: 'Kitchen',
          permalink: 'kitchen',
        },
        {
          id: 'category-1',
          name: 'Coffee Machines',
          permalink: 'kitchen/coffee-machines',
        },
      ],
      id: 'product-1',
      slug: 'everyday-bowl',
      name: 'Everyday Bowl',
      description: 'A useful bowl.',
      descriptionHtml: '<p>A useful bowl.</p>',
      metaDescription: 'A concise bowl description.',
      price: {
        amount: 24,
        currencyCode: 'USD',
      },
      compareAtPrice: {
        amount: 32,
        currencyCode: 'USD',
      },
      defaultVariantId: 'variant-1',
      images: [
        {
          id: 'media-1',
          src: 'https://example.com/large.jpg',
          alt: 'Bowl angle one',
          variantIds: ['variant-1'],
        },
      ],
      inStock: true,
      options: [],
      purchasable: true,
      specifications: [
        {
          label: 'Warranty',
          value: '2 Years',
        },
        {
          label: 'Capacity',
          value: '1.5L',
        },
      ],
      variants: [],
      variantCount: 1,
    })
  })

  it('preserves configured option swatch metadata in the product model', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      variants: [
        {
          id: 'variant-pink',
          product_id: 'product-1',
          sku: 'BOWL-PINK',
          options_text: 'Color: Pink',
          track_inventory: true,
          media_count: 0,
          thumbnail_url: null,
          purchasable: true,
          in_stock: true,
          backorderable: false,
          weight: null,
          height: null,
          width: null,
          depth: null,
          price: baseProduct.price,
          original_price: null,
          option_values: [
            {
              id: 'option-value-pink',
              option_type_id: 'option-type-color',
              name: 'pink',
              label: 'Pink',
              position: 1,
              color_code: '#f46565',
              image_url: 'https://example.com/pink-swatch.jpg',
              option_type_name: 'color',
              option_type_label: 'Color',
            },
          ],
        },
      ],
    })

    expect(product.options[0]?.values[0]).toEqual({
      id: 'option-value-pink',
      name: 'pink',
      label: 'Pink',
      colorCode: '#f46565',
      imageUrl: 'https://example.com/pink-swatch.jpg',
    })
    expect(product.variants[0]?.optionValues[0]).toMatchObject({
      colorCode: '#f46565',
      imageUrl: 'https://example.com/pink-swatch.jpg',
    })
  })

  it('throws when Spree price data is incomplete', () => {
    expect(() =>
      mapSpreeProductToSummary({
        ...baseProduct,
        price: {
          ...baseProduct.price,
          amount_in_cents: null,
        },
      }),
    ).toThrow('Spree price is missing amount or currency')
  })
})
