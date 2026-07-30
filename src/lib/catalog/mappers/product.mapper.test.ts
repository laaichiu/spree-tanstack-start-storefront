import { describe, expect, it } from 'vitest'

import { baseProduct } from './product.mapper.fixture'
import { mapSpreeProductToProduct } from './product.mapper'

describe('mapSpreeProductToProduct', () => {
  it('maps a Spree product into the storefront product detail model', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      meta_title: 'Everyday Bowl | Spree',
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
          field_type: 'short_text',
          value: '2 Years',
        },
        {
          id: 'field-2',
          key: 'custom.capacity',
          label: 'Capacity',
          type: 'Spree::Metafields::ShortText',
          field_type: 'short_text',
          value: '1.5L',
        },
      ],
    })

    expect(product).toEqual({
      backorderable: false,
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
      metaTitle: 'Everyday Bowl | Spree',
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
          srcSet:
            'https://example.com/medium.jpg 400w, https://example.com/large.jpg 720w',
          alt: 'Bowl angle one',
          variantIds: ['variant-1'],
        },
      ],
      inStock: true,
      preorder: false,
      preorderShipsAt: null,
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
          preorder: false,
          preorder_ships_at: null,
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

  it('maps Compare-at amounts for variants when no Price List price is active', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      variants: [
        {
          id: 'variant-sale',
          product_id: 'product-1',
          sku: 'BOWL-SALE',
          options_text: 'Color: Stone',
          track_inventory: true,
          media_count: 0,
          thumbnail_url: null,
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
            compare_at_amount: '30.00',
            compare_at_amount_in_cents: 3000,
            display_compare_at_amount: '$30.00',
          },
          original_price: null,
          option_values: [],
        },
      ],
    })

    expect(product.variants[0]?.compareAtPrice).toEqual({
      amount: 30,
      currencyCode: 'USD',
    })
  })

  it('maps product option values when variants do not provide option values', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      option_values: [
        {
          id: 'option-value-stone',
          option_type_id: 'option-type-color',
          name: 'stone',
          label: 'Stone',
          position: 1,
          color_code: '#d8cbb8',
          option_type_name: 'color',
          option_type_label: 'Color',
          image_url: null,
        },
      ],
    })

    expect(product.options).toEqual([
      {
        id: 'option-type-color',
        name: 'color',
        label: 'Color',
        values: [
          {
            id: 'option-value-stone',
            name: 'stone',
            label: 'Stone',
            colorCode: '#d8cbb8',
            imageUrl: null,
          },
        ],
      },
    ])
  })

  it('keeps purchasable pre-order products and variants addable', () => {
    const product = mapSpreeProductToProduct({
      ...baseProduct,
      in_stock: false,
      preorder: true,
      preorder_ships_at: '2026-10-01',
      variants: [
        {
          id: 'variant-preorder',
          product_id: 'product-1',
          sku: 'BOWL-PREORDER',
          options_text: '',
          track_inventory: true,
          media_count: 0,
          thumbnail_url: null,
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
    })

    expect(product.inStock).toBe(false)
    expect(product.preorder).toBe(true)
    expect(product.variants[0]).toMatchObject({
      backorderable: false,
      inStock: false,
      preorder: true,
      preorderShipsAt: '2026-10-01',
      purchasable: true,
    })
  })
})
