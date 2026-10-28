import { describe, expect, it } from 'vitest'
import type { Category, Product } from '@spree/sdk'

import { SEARCH_SUGGESTION_POSITION_FIELD } from '@/config/search'

import { categoryResource } from '../utils/catalog-category-response.test-support'
import { baseProduct } from './product.mapper.fixture'
import { mapProductSpecifications } from './product-specification.mapper'
import {
  mapSearchSuggestionCategories,
  mapSearchSuggestionProducts,
  SearchSuggestionResponseError,
} from './search-suggestions.mapper'

function field(value: unknown) {
  return {
    field_type: 'number' as const,
    id: 'cf_position',
    key: SEARCH_SUGGESTION_POSITION_FIELD,
    label: 'Search drawer position',
    value,
  }
}

function product(id: string, value: unknown): Product {
  return {
    ...baseProduct,
    custom_fields: [field(value)],
    default_variant_id: 'variant_default',
    id,
  }
}

function category(id: string, value: unknown): Category {
  return { ...categoryResource({ id }), custom_fields: [field(value)] }
}

describe('search drawer Custom Field selection', () => {
  it('orders configured products, including Spree decimal strings, before limiting', () => {
    const result = mapSearchSuggestionProducts(
      [
        product('prod_later', '30.0'),
        product('prod_first', 10),
        product('prod_second', '20.0'),
      ],
      2,
    )
    expect(result.map((item) => item.id)).toEqual(['prod_first', 'prod_second'])
    expect(result[0]).not.toHaveProperty('custom_fields')
  })

  it('selects child categories independently from the navigation tree', () => {
    const child = {
      ...category('ctg_child', '10.0'),
      depth: 1,
      is_child: true,
      is_root: false,
      parent_id: 'ctg_parent',
      permalink: 'kitchen/coffee',
    }
    const result = mapSearchSuggestionCategories(
      [category('ctg_later', 20), child],
      8,
    )
    expect(result.map((item) => item.id)).toEqual(['ctg_child', 'ctg_later'])
    expect(result[0]).toMatchObject({
      children: [],
      permalink: 'kitchen/coffee',
    })
  })

  it('omits unconfigured, zero, negative, fractional, and unsafe positions without a fallback', () => {
    const unconfigured = {
      ...product('prod_unconfigured', 1),
      custom_fields: [],
    }
    expect(
      mapSearchSuggestionProducts(
        [
          unconfigured,
          product('prod_zero', 0),
          product('prod_negative', -10),
          product('prod_fraction', '1.5'),
          product('prod_precise_fraction', '9007199254740991.1'),
          product('prod_unsafe', Number.MAX_SAFE_INTEGER + 1),
        ],
        8,
      ),
    ).toEqual([])
    expect(mapSearchSuggestionCategories([], 8)).toEqual([])
  })

  it('uses resource identity to break tied positions consistently', () => {
    expect(
      mapSearchSuggestionCategories(
        [category('ctg_b', 10), category('ctg_a', 10)],
        8,
      ).map((item) => item.id),
    ).toEqual(['ctg_a', 'ctg_b'])
  })

  it.each([null, false, '', ' 10 ', '10px', 'Infinity', Infinity, {}, []])(
    'rejects malformed position values: %j',
    (value) => {
      expect(() =>
        mapSearchSuggestionCategories([category('ctg_bad', value)], 8),
      ).toThrow()
    },
  )

  it('rejects missing expansions, wrong field types, duplicate fields and invalid field identity', () => {
    const valid = category('ctg_valid', 10)
    for (const custom_fields of [
      undefined,
      [field(10), field(20)],
      [{ ...field(10), field_type: 'short_text' }],
      [{ ...field(10), id: 'prod_wrong' }],
    ]) {
      expect(() =>
        mapSearchSuggestionCategories(
          [{ ...valid, custom_fields } as Category],
          8,
        ),
      ).toThrow(SearchSuggestionResponseError)
    }
    expect(() => mapSearchSuggestionCategories([valid, valid], 8)).toThrow(
      SearchSuggestionResponseError,
    )
  })

  it('validates product and category resource identity and nested ownership before mapping', () => {
    expect(() =>
      mapSearchSuggestionProducts([product('sel_wrong', 10)], 8),
    ).toThrow()
    expect(() =>
      mapSearchSuggestionCategories([category('prod_wrong', 10)], 8),
    ).toThrow()
    const mixedOwner = {
      ...product('prod_owner', 10),
      variants: [{ id: 'variant_wrong', product_id: 'prod_other' }],
    } as unknown as Product
    expect(() => mapSearchSuggestionProducts([mixedOwner], 8)).toThrow(
      'does not belong',
    )
    expect(() =>
      mapSearchSuggestionCategories(
        [
          {
            ...category('ctg_parent', 10),
            children: [
              { ...category('ctg_child', 20), parent_id: 'ctg_other' },
            ],
          },
        ],
        8,
      ),
    ).toThrow('does not belong')
  })

  it('keeps search merchandising fields out of product specifications', () => {
    const item = product('prod_specs', 10)
    item.custom_fields?.push({
      id: 'cf_material',
      key: 'properties.material',
      label: 'Material',
      field_type: 'short_text',
      value: 'Cotton',
    })
    expect(mapProductSpecifications(item)).toEqual([
      { label: 'Material', value: 'Cotton' },
    ])
  })
})
