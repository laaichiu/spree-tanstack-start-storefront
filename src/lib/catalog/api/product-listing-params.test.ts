import { describe, expect, it, vi } from 'vitest'
import { createClient } from '@spree/sdk'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'

import {
  toProductFiltersParams,
  toProductListParams,
} from './product-listing-params'
import { getProductListingFilters } from './get-product-summaries'

describe('toProductFiltersParams', () => {
  it('keeps Seller filtering inside the Store API filter query', () => {
    expect(
      toProductFiltersParams(DEFAULT_PRODUCT_LISTING_SEARCH, {
        sellerId: 'sel_Apple',
      }),
    ).toEqual({ q: { seller_id_eq: 'sel_Apple' } })
  })
})

describe('toProductListParams', () => {
  it('sends price filters as decimal strings', () => {
    expect(
      toProductListParams({
        ...DEFAULT_PRODUCT_LISTING_SEARCH,
        price_min: 12.345,
        price_max: 99,
      }),
    ).toMatchObject({ price_gte: '12.345', price_lte: '99' })
  })
  it.each([
    ['newest', '-created_at'],
    ['oldest', 'created_at'],
    ['price-asc', 'price'],
    ['price-desc', '-price'],
    ['name-asc', 'name'],
    ['name-desc', '-name'],
    ['best-selling', 'best_selling'],
  ] as const)('maps %s to the Store API sort %s', (sort, expected) => {
    expect(
      toProductListParams({ ...DEFAULT_PRODUCT_LISTING_SEARCH, sort }).sort,
    ).toBe(expected)
  })
})

it.each([
  [12.345, 99],
  ['12.345', '99.000'],
])(
  'uses the installed SDK to serialize facets and normalize range responses: %j, %j',
  async (min, max) => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            default_sort: 'price',
            filters: [
              {
                id: 'price',
                type: 'price_range',
                currency: 'KWD',
                min,
                max,
              },
            ],
            sort_options: [{ id: 'price', label: 'Price' }],
            total_count: 2,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
    )
    const client = createClient({
      baseUrl: 'https://example.com',
      publishableKey: 'pk_fixture',
      retry: false,
      fetch: fetchMock,
    })
    const result = await getProductListingFilters(
      client,
      {
        ...DEFAULT_PRODUCT_LISTING_SEARCH,
        option: ['optval_one', 'optval_two'],
        price_min: 12.345,
      },
      { sellerId: 'sel_fixture' },
    )
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.searchParams.get('q[price_gte]')).toBe('12.345')
    expect(url.searchParams.get('q[seller_id_eq]')).toBe('sel_fixture')
    expect(url.searchParams.getAll('q[with_option_value_ids][]')).toEqual([
      'optval_one',
      'optval_two',
    ])
    expect(url.searchParams.has('q')).toBe(false)
    expect(result.filters).toEqual([
      {
        id: 'price',
        type: 'price_range',
        currency: 'KWD',
        min: 12.345,
        max: 99,
      },
    ])
  },
)
