import { describe, expect, it } from 'vitest'

import type { Product } from '../model/product'
import {
  getDefaultSelectedOptions,
  isOptionValueSelectable,
  resolveSelectedVariant,
} from './variant-selection'

const product = {
  categoryBreadcrumbs: [],
  id: 'product-1',
  slug: 'mug',
  name: 'Mug',
  description: '',
  descriptionHtml: '',
  metaDescription: '',
  price: {
    amount: 10,
    currencyCode: 'USD',
  },
  defaultVariantId: 'variant-stone-small',
  images: [],
  inStock: true,
  options: [
    {
      id: 'option-color',
      name: 'color',
      label: 'Color',
      values: [
        {
          id: 'value-stone',
          name: 'stone',
          label: 'Stone',
          colorCode: null,
          imageUrl: null,
        },
        {
          id: 'value-black',
          name: 'black',
          label: 'Black',
          colorCode: '#111111',
          imageUrl: null,
        },
      ],
    },
    {
      id: 'option-size',
      name: 'size',
      label: 'Size',
      values: [
        {
          id: 'value-small',
          name: 'small',
          label: 'Small',
          colorCode: null,
          imageUrl: null,
        },
        {
          id: 'value-large',
          name: 'large',
          label: 'Large',
          colorCode: null,
          imageUrl: null,
        },
      ],
    },
  ],
  purchasable: true,
  specifications: [],
  variantCount: 3,
  variants: [
    {
      id: 'variant-stone-small',
      sku: 'STONE-S',
      price: {
        amount: 10,
        currencyCode: 'USD',
      },
      inStock: false,
      optionValues: [
        {
          id: 'value-stone',
          name: 'stone',
          label: 'Stone',
          colorCode: null,
          imageUrl: null,
          optionTypeId: 'option-color',
          optionTypeName: 'color',
          optionTypeLabel: 'Color',
        },
        {
          id: 'value-small',
          name: 'small',
          label: 'Small',
          colorCode: null,
          imageUrl: null,
          optionTypeId: 'option-size',
          optionTypeName: 'size',
          optionTypeLabel: 'Size',
        },
      ],
    },
    {
      id: 'variant-stone-large',
      sku: 'STONE-L',
      price: {
        amount: 12,
        currencyCode: 'USD',
      },
      inStock: true,
      optionValues: [
        {
          id: 'value-stone',
          name: 'stone',
          label: 'Stone',
          colorCode: null,
          imageUrl: null,
          optionTypeId: 'option-color',
          optionTypeName: 'color',
          optionTypeLabel: 'Color',
        },
        {
          id: 'value-large',
          name: 'large',
          label: 'Large',
          colorCode: null,
          imageUrl: null,
          optionTypeId: 'option-size',
          optionTypeName: 'size',
          optionTypeLabel: 'Size',
        },
      ],
    },
    {
      id: 'variant-black-small',
      sku: 'BLACK-S',
      price: {
        amount: 11,
        currencyCode: 'USD',
      },
      inStock: true,
      optionValues: [
        {
          id: 'value-black',
          name: 'black',
          label: 'Black',
          colorCode: '#111111',
          imageUrl: null,
          optionTypeId: 'option-color',
          optionTypeName: 'color',
          optionTypeLabel: 'Color',
        },
        {
          id: 'value-small',
          name: 'small',
          label: 'Small',
          colorCode: null,
          imageUrl: null,
          optionTypeId: 'option-size',
          optionTypeName: 'size',
          optionTypeLabel: 'Size',
        },
      ],
    },
  ],
} satisfies Product

describe('variant selection', () => {
  it('defaults to the first in-stock variant', () => {
    expect(getDefaultSelectedOptions(product)).toEqual({
      'option-color': 'value-stone',
      'option-size': 'value-large',
    })
  })

  it('resolves a selected variant from option value ids', () => {
    expect(
      resolveSelectedVariant(product, {
        'option-color': 'value-black',
        'option-size': 'value-small',
      })?.id,
    ).toBe('variant-black-small')
  })

  it('returns null for unavailable option combinations', () => {
    expect(
      resolveSelectedVariant(product, {
        'option-color': 'value-black',
        'option-size': 'value-large',
      }),
    ).toBeNull()
  })

  it('marks options as selectable only when an in-stock variant exists', () => {
    expect(
      isOptionValueSelectable({
        optionId: 'option-size',
        product,
        selectedOptions: {
          'option-color': 'value-stone',
          'option-size': 'value-large',
        },
        valueId: 'value-small',
      }),
    ).toBe(false)
  })
})
