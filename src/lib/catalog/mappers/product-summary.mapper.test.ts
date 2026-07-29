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
      defaultVariantId: 'variant-1',
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
      backorderable: false,
      variants: [],
      variantsLoaded: false,
      inStock: true,
      purchasable: true,
      preorder: false,
    })
  })

  it('maps expanded variant pricing, color options, and thumbnail images', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      variants: [
        {
          id: 'variant-blue',
          product_id: 'product-1',
          sku: 'BOWL-BLUE',
          options_text: 'Color: Blue',
          track_inventory: true,
          media_count: 1,
          thumbnail_url: 'https://example.com/blue.jpg',
          purchasable: true,
          in_stock: true,
          preorder: false,
          preorder_ships_at: null,
          backorderable: false,
          weight: null,
          height: null,
          width: null,
          depth: null,
          price: {
            ...baseProduct.price,
            id: 'price-blue',
            amount: '18.00',
            amount_in_cents: 1800,
          },
          original_price: {
            ...baseProduct.price,
            id: 'price-blue-original',
            amount: '24.00',
            amount_in_cents: 2400,
          },
          option_values: [
            {
              id: 'option-value-blue',
              option_type_id: 'option-type-color',
              name: 'blue',
              label: 'Blue',
              position: 1,
              color_code: '#345b82',
              image_url: null,
              option_type_name: 'color',
              option_type_label: 'Color',
            },
          ],
        },
      ],
    })

    expect(summary.defaultVariantId).toBe('variant-1')
    expect(summary.variants).toEqual([
      {
        backorderable: false,
        compareAtPrice: { amount: 24, currencyCode: 'USD' },
        id: 'variant-blue',
        image: {
          alt: 'Color: Blue',
          id: 'variant-blue:thumbnail',
          src: 'https://example.com/blue.jpg',
          variantIds: ['variant-blue'],
        },
        inStock: true,
        optionValues: [
          {
            colorCode: '#345b82',
            id: 'option-value-blue',
            imageUrl: null,
            label: 'Blue',
            name: 'blue',
            optionTypeId: 'option-type-color',
            optionTypeLabel: 'Color',
            optionTypeName: 'color',
          },
        ],
        preorder: false,
        preorderShipsAt: null,
        purchasable: true,
        price: { amount: 18, currencyCode: 'USD' },
        sku: 'BOWL-BLUE',
      },
    ])
  })

  it('uses the expanded default variant instead of product-level aggregate flags', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      preorder: true,
      variants: [
        {
          id: 'variant-preorder',
          product_id: 'product-1',
          sku: 'BOWL-PREORDER',
          options_text: 'Color: Black',
          track_inventory: true,
          media_count: 0,
          thumbnail_url: 'https://example.com/black.jpg',
          purchasable: true,
          in_stock: false,
          backorderable: false,
          preorder: true,
          preorder_ships_at: '2026-10-01',
          weight: null,
          height: null,
          width: null,
          depth: null,
          price: baseProduct.price,
          original_price: null,
          option_values: [],
        },
      ],
      default_variant: {
        id: 'variant-1',
        product_id: 'product-1',
        sku: 'BOWL-DEFAULT',
        options_text: 'Color: White',
        track_inventory: true,
        media_count: 0,
        thumbnail_url: 'https://example.com/white.jpg',
        purchasable: true,
        in_stock: true,
        backorderable: false,
        preorder: false,
        preorder_ships_at: null,
        weight: null,
        height: null,
        width: null,
        depth: null,
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
        option_values: [],
      },
    })

    expect(summary.price).toEqual({ amount: 20, currencyCode: 'USD' })
    expect(summary.compareAtPrice).toEqual({
      amount: 25,
      currencyCode: 'USD',
    })
    expect(summary.image?.src).toBe('https://example.com/white.jpg')
    expect(summary.inStock).toBe(true)
    expect(summary.preorder).toBe(false)
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

  it('keeps API stock separate from product purchase availability', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      purchasable: false,
      in_stock: true,
    })

    expect(summary.inStock).toBe(true)
    expect(summary.purchasable).toBe(false)
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

  it('maps the configured Compare-at amount as the sale reference price', () => {
    const summary = mapSpreeProductToSummary({
      ...baseProduct,
      price: {
        ...baseProduct.price,
        compare_at_amount: '30.00',
        compare_at_amount_in_cents: 3000,
        display_compare_at_amount: '$30.00',
      },
    })

    expect(summary.compareAtPrice).toEqual({
      amount: 30,
      currencyCode: 'USD',
    })
  })
})
