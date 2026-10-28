// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { baseProduct } from './product.mapper.fixture'
import {
  assertCatalogProductResponse,
  CatalogProductResponseTypeMismatchError,
} from './product-response'

const price = {
  amount: '24.00',
  compare_at_amount: null,
  compare_at_amount_in_cents: null,
  currency: 'USD',
}

const media = {
  alt: 'Blue bowl',
  id: 'media_1',
  large_url: 'https://example.com/large.jpg',
  medium_url: 'https://example.com/medium.jpg',
  mini_url: null,
  original_url: 'https://example.com/original.jpg',
  product_id: 'prod_1',
  small_url: 'https://example.com/small.jpg',
  variant_ids: ['variant_1'],
}

const optionValue = {
  color_code: '#345b82',
  id: 'option-value-1',
  image_url: null,
  label: 'Blue',
  name: 'blue',
  option_type_id: 'option-type-1',
  option_type_label: 'Color',
  option_type_name: 'color',
}

const customField = {
  field_type: 'short_text',
  label: 'Material',
  value: 'Cotton',
}

const variant = {
  backorderable: false,
  id: 'variant_1',
  in_stock: true,
  option_values: [optionValue],
  options_text: 'Color: Blue',
  original_price: null,
  preorder: false,
  preorder_ships_at: null,
  price,
  product_id: 'prod_1',
  purchasable: true,
  primary_media: media,
  sku: 'BOWL-BLUE',
  thumbnail_url: null,
}

const product = {
  ...baseProduct,
  backorderable: false,
  default_variant: variant,
  default_variant_id: 'variant_1',
  description: 'A useful bowl.',
  description_html: '<p>A useful bowl.</p>',
  id: 'prod_1',
  in_stock: true,
  meta_description: null,
  meta_title: null,
  name: 'Everyday Bowl',
  original_price: null,
  preorder: false,
  preorder_ships_at: null,
  price,
  purchasable: true,
  slug: 'everyday-bowl',
  custom_fields: [customField],
  variant_count: 1,
  variants: [variant],
}

describe('catalog product response boundary', () => {
  it('accepts the fields used by product and variant mappers', () => {
    expect(() => assertCatalogProductResponse(product)).not.toThrow()
  })

  it.each([
    ['name', { name: undefined }],
    ['slug', { slug: null }],
    ['description html', { description_html: 123 }],
    ['thumbnail url', { thumbnail_url: 42 }],
    ['availability', { in_stock: 'yes' }],
    ['variant count', { variant_count: -1 }],
    ['price', { price: null }],
    [
      'legacy cents-only price',
      {
        price: {
          amount_in_cents: 2400,
          compare_at_amount_in_cents: null,
          currency: 'USD',
        },
      },
    ],
    ['non-decimal price', { price: { ...price, amount: '0x24' } }],
    ['negative price', { price: { ...price, amount: '-1' } }],
    ['blank price currency', { price: { ...price, currency: '' } }],
    ['original price', { original_price: 10 }],
    ['numeric original price', { original_price: { ...price, amount: 25 } }],
    [
      'blank original price currency',
      { original_price: { ...price, currency: '' } },
    ],
    ['default variant id', { default_variant_id: 10 }],
  ])('rejects a malformed product %s field', (_field, override) => {
    expect(() =>
      assertCatalogProductResponse({ ...product, ...override }),
    ).toThrow(CatalogProductResponseTypeMismatchError)
  })

  it.each([
    ['missing value', { value: undefined }],
    ['boolean value', { field_type: 'boolean', value: 'false' }],
    ['number value', { field_type: 'number', value: 'not-a-number' }],
    [
      'rich text value',
      { field_type: 'rich_text', value: { html: '<p>x</p>' } },
    ],
    ['json value', { field_type: 'json', value: undefined }],
  ])('rejects malformed custom-field %s', (_field, override) => {
    expect(() =>
      assertCatalogProductResponse({
        ...product,
        custom_fields: [{ ...customField, ...override }],
      }),
    ).toThrow(CatalogProductResponseTypeMismatchError)
  })

  it.each([
    ['boolean', { field_type: 'boolean', value: false }],
    ['number string', { field_type: 'number', value: '12.50' }],
    ['json object', { field_type: 'json', value: { material: 'cotton' } }],
    ['rich text', { field_type: 'rich_text', value: '<p>Cotton</p>' }],
  ])('accepts valid custom-field %s values', (_field, override) => {
    expect(() =>
      assertCatalogProductResponse({
        ...product,
        custom_fields: [{ ...customField, ...override }],
      }),
    ).not.toThrow()
  })

  it.each([
    ['variant price', { variants: [{ ...variant, price: null }] }],
    [
      'non-decimal variant price',
      {
        variants: [{ ...variant, price: { ...price, amount: '0x24' } }],
      },
    ],
    [
      'blank variant price currency',
      {
        variants: [{ ...variant, price: { ...price, currency: '' } }],
      },
    ],
    [
      'numeric variant compare-at amount',
      {
        variants: [
          {
            ...variant,
            price: { ...price, compare_at_amount: 25 },
          },
        ],
      },
    ],
    [
      'negative variant compare-at amount',
      {
        variants: [
          {
            ...variant,
            price: { ...price, compare_at_amount: '-1' },
          },
        ],
      },
    ],
    ['variant options', { variants: [{ ...variant, option_values: [{}] }] }],
    ['variant media', { variants: [{ ...variant, primary_media: {} }] }],
    [
      'media variant ids',
      {
        variants: [
          { ...variant, primary_media: { ...media, variant_ids: null } },
        ],
      },
    ],
    [
      'option value label',
      {
        variants: [
          { ...variant, option_values: [{ ...optionValue, label: undefined }] },
        ],
      },
    ],
  ])('rejects malformed nested %s data', (_field, override) => {
    expect(() =>
      assertCatalogProductResponse({ ...product, ...override }),
    ).toThrow(CatalogProductResponseTypeMismatchError)
  })

  it('keeps absent optional expansions valid', () => {
    const {
      default_variant: _defaultVariant,
      variants: _variants,
      ...withoutVariants
    } = product

    expect(() => assertCatalogProductResponse(withoutVariants)).not.toThrow()
  })
})
