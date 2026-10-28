// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedMarket } from '@/lib/core/market'
import { marketResource } from '@/lib/market/utils/market-response.test-support'

import { categoryResource } from '../utils/catalog-category-response.test-support'
import { baseProduct } from '../mappers/product.mapper.fixture'
import {
  getSearchSuggestionCategoriesForMarket,
  getSearchSuggestionProductsForMarket,
} from './get-search-suggestions.server'

const mocks = vi.hoisted(() => ({
  categories: vi.fn(),
  products: vi.fn(),
  getClient: vi.fn(),
}))
vi.mock('@tanstack/react-start/server-only', () => ({}))
vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: mocks.getClient,
}))

const market: ResolvedMarket = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'US Dollar',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'mkt_us',
  marketName: 'US',
}
const custom_fields = [
  {
    id: 'cf_position',
    key: 'merchandising.search_position',
    label: 'Search drawer position',
    field_type: 'number',
    value: '10.0',
  },
]
function response(data: unknown[], page = 1, pages = 1) {
  return {
    data,
    meta: {
      page,
      pages,
      count: data.length,
      limit: 100,
      from: 1,
      to: data.length,
    },
  }
}

describe('search suggestion Store API loading', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getClient.mockReturnValue({
      products: { list: mocks.products },
      categories: { list: mocks.categories },
    })
  })

  it('uses the active market, the rank filter and stable product pagination', async () => {
    mocks.products.mockResolvedValue(
      response([
        {
          ...baseProduct,
          id: 'prod_selected',
          default_variant_id: 'variant_default',
          custom_fields,
        },
      ]),
    )
    const result = await getSearchSuggestionProductsForMarket(market)
    expect(mocks.getClient).toHaveBeenCalledWith(market)
    expect(mocks.products).toHaveBeenCalledWith(
      expect.objectContaining({
        cf_merchandising_search_position_gt: 0,
        sort: 'id',
        expand: expect.arrayContaining([
          'custom_fields',
          'default_variant.primary_media',
        ]),
      }),
    )
    expect(result.map((item) => item.id)).toEqual(['prod_selected'])
  })

  it('reads later category pages and includes selected children in configured order', async () => {
    mocks.categories
      .mockResolvedValueOnce(
        response([categoryResource({ custom_fields: [] })], 1, 2),
      )
      .mockResolvedValueOnce(
        response(
          [
            categoryResource({
              custom_fields,
              depth: 1,
              id: 'ctg_selected_child',
              is_root: false,
              is_child: true,
              parent_id: 'ctg_parent',
            }),
          ],
          2,
          2,
        ),
      )
    const result = await getSearchSuggestionCategoriesForMarket(market)
    expect(mocks.categories.mock.calls.map(([params]) => params.page)).toEqual([
      1, 2,
    ])
    expect(result.map((item) => item.id)).toEqual(['ctg_selected_child'])
  })

  it('reads later product pages before applying the display limit', async () => {
    mocks.products
      .mockResolvedValueOnce(
        response(
          [
            {
              ...baseProduct,
              id: 'prod_fraction',
              default_variant_id: 'variant_default',
              custom_fields: [{ ...custom_fields[0], value: '0.5' }],
            },
          ],
          1,
          2,
        ),
      )
      .mockResolvedValueOnce(
        response(
          [
            {
              ...baseProduct,
              id: 'prod_selected',
              default_variant_id: 'variant_default',
              custom_fields,
            },
          ],
          2,
          2,
        ),
      )
    expect(
      (await getSearchSuggestionProductsForMarket(market)).map(
        (item) => item.id,
      ),
    ).toEqual(['prod_selected'])
  })

  it.each([
    { data: null, meta: {} },
    { data: [], meta: { page: 1, pages: '2' } },
    response([], 2, 2),
    response([], 1, 101),
    response([categoryResource({ custom_fields })], 1, 0),
    response([marketResource()]),
    response([categoryResource({ custom_fields: null })]),
  ])('rejects malformed envelopes, pagination and resources', async (value) => {
    mocks.categories.mockResolvedValue(value)
    await expect(
      getSearchSuggestionCategoriesForMarket(market),
    ).rejects.toThrow()
  })

  it('returns an empty selection and preserves backend failures for the query error state', async () => {
    mocks.products.mockResolvedValue(response([]))
    expect(await getSearchSuggestionProductsForMarket(market)).toEqual([])
    mocks.categories.mockRejectedValue(new Error('unavailable'))
    await expect(
      getSearchSuggestionCategoriesForMarket(market),
    ).rejects.toThrow('unavailable')
  })

  it('accepts a zero-page empty response and rejects pagination that shrinks past the requested page', async () => {
    mocks.categories.mockResolvedValue(response([], 1, 0))
    expect(await getSearchSuggestionCategoriesForMarket(market)).toEqual([])
    mocks.categories
      .mockResolvedValueOnce(
        response([categoryResource({ custom_fields })], 1, 2),
      )
      .mockResolvedValueOnce(response([], 2, 1))
    await expect(
      getSearchSuggestionCategoriesForMarket(market),
    ).rejects.toThrow()
  })

  it('fails a partial selection when a later page is unavailable or repeats a resource', async () => {
    const selected = categoryResource({ custom_fields })
    mocks.categories
      .mockResolvedValueOnce(response([selected], 1, 2))
      .mockRejectedValueOnce(new Error('later page unavailable'))
    await expect(
      getSearchSuggestionCategoriesForMarket(market),
    ).rejects.toThrow('later page unavailable')
    mocks.categories
      .mockResolvedValueOnce(response([selected], 1, 2))
      .mockResolvedValueOnce(response([selected], 2, 2))
    await expect(
      getSearchSuggestionCategoriesForMarket(market),
    ).rejects.toThrow()
  })
})
