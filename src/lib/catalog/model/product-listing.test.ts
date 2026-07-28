import { describe, expect, it } from 'vitest'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from './product-listing'
import {
  getActiveFilterCount,
  parseProductListingSearch,
} from '../utils/product-listing-search'
import {
  fromProductListingApiInput,
  toProductListingApiInput,
  toProductFiltersParams,
  toProductListParams,
} from '../api/product-listing-params'

describe('product-listing search helpers', () => {
  it('parses supported listing search params', () => {
    expect(
      parseProductListingSearch({
        availability: 'in_stock',
        limit: '72',
        option: 'optval-black,optval-white',
        page: '2',
        price_max: '200',
        price_min: '50',
        q: 'coffee',
        sort: 'price-asc',
      }),
    ).toEqual({
      availability: 'in_stock',
      limit: 48,
      option: ['optval-black', 'optval-white'],
      page: 2,
      price_max: 200,
      price_min: 50,
      q: 'coffee',
      sort: 'price-asc',
    })
  })

  it('parses router-serialized option arrays', () => {
    expect(
      parseProductListingSearch({
        option: '["optval-black","optval-white"]',
      }).option,
    ).toEqual(['optval-black', 'optval-white'])
  })

  it('falls back to defaults for unsupported values', () => {
    expect(
      parseProductListingSearch({
        availability: 'archived',
        page: '-1',
        sort: 'name',
      }),
    ).toEqual(DEFAULT_PRODUCT_LISTING_SEARCH)
  })

  it('maps listing search to product list params', () => {
    expect(
      toProductListParams({
        availability: 'out_of_stock',
        limit: 24,
        option: ['optval-black'],
        page: 3,
        price_max: 200,
        price_min: 50,
        q: 'coffee',
        sort: 'price-desc',
      }),
    ).toEqual({
      limit: 24,
      page: 3,
      out_of_stock: true,
      price_gte: 50,
      price_lte: 200,
      search: 'coffee',
      sort: '-price',
      with_option_value_ids: ['optval-black'],
    })
  })

  it.each([
    ['price-asc', 'price'],
    ['price-desc', '-price'],
    ['name-asc', 'name'],
    ['name-desc', '-name'],
    ['newest', '-available_on'],
    ['oldest', 'available_on'],
    ['best-selling', 'best_selling'],
  ] as const)(
    'maps %s sorting to the Spree %s sort value',
    (sort, expected) => {
      expect(
        toProductListParams({
          ...DEFAULT_PRODUCT_LISTING_SEARCH,
          sort,
        }).sort,
      ).toBe(expected)
    },
  )

  it('round-trips normalized search through the catalog API input', () => {
    const search = {
      availability: 'in_stock' as const,
      limit: 24,
      option: ['optval-black'],
      page: 2,
      price_max: 200,
      price_min: 50,
      q: 'coffee',
      sort: 'price-asc' as const,
    }

    expect(toProductListingApiInput(search)).toEqual({
      availability: 'in_stock',
      limit: 24,
      option: ['optval-black'],
      page: 2,
      price_max: 200,
      price_min: 50,
      query: 'coffee',
      sort: 'price-asc',
    })
    expect(
      fromProductListingApiInput(toProductListingApiInput(search)),
    ).toEqual(search)
    expect(fromProductListingApiInput({})).toEqual(
      DEFAULT_PRODUCT_LISTING_SEARCH,
    )
  })

  it('maps listing search to Spree filter params', () => {
    expect(
      toProductFiltersParams(
        {
          availability: 'in_stock',
          limit: 24,
          option: ['optval-black'],
          page: 1,
          price_min: 50,
          sort: 'newest',
        },
        { categoryId: 'ctg-kitchen' },
      ),
    ).toEqual({
      'q[in_category]': 'ctg-kitchen',
      'q[in_stock]': true,
      'q[price_gte]': 50,
      'q[with_option_value_ids][]': ['optval-black'],
    })
  })

  it('counts active filters', () => {
    expect(
      getActiveFilterCount({
        availability: 'in_stock',
        limit: 24,
        option: ['black', 'white'],
        page: 1,
        price_max: 100,
        sort: 'newest',
      }),
    ).toBe(4)
  })
})
