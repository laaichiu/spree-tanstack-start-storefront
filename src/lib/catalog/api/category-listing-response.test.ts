// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedMarket } from '@/lib/core/market'
import type * as CategoryNavigationMapper from '../mappers/category-navigation.mapper'

import { getCatalogSitemapData } from './get-catalog-sitemap.server'
import { getHomeCategorySummariesForMarket } from './get-home-category-summaries.server'
import { getNavigationCategoriesForMarket } from './get-navigation-categories.server'
import { categoryResource } from '../utils/catalog-category-response.test-support'
import { marketResource } from '@/lib/market/utils/market-response.test-support'

const server = vi.hoisted(() => ({
  getServerSpreeClient: vi.fn(),
  getServerSpreeClientForMarket: vi.fn(),
  isSyntheticCatalogRootCategory: vi.fn(),
  listMarketsWithExpandedCountries: vi.fn(),
  mapHomeCategories: vi.fn(),
  mapMarkets: vi.fn(),
  mapNavigationCategories: vi.fn(),
  mapSummary: vi.fn(),
  reportError: vi.fn(),
  getProductListing: vi.fn(),
}))

const client = {
  categories: {
    list: vi.fn(),
  },
}

vi.mock('@tanstack/react-start/server-only', () => ({}))

vi.mock('@/lib/catalog/mappers/category.mapper', () => ({
  isSyntheticCatalogRootCategory: server.isSyntheticCatalogRootCategory,
  mapSpreeCategoriesToHomeSummaries: server.mapHomeCategories,
  mapSpreeCategoryToSummary: server.mapSummary,
}))

vi.mock(
  '@/lib/catalog/mappers/category-navigation.mapper',
  async (importOriginal) => ({
    ...(await importOriginal<typeof CategoryNavigationMapper>()),
    mapSpreeCategoriesToNavigationItems: server.mapNavigationCategories,
  }),
)

vi.mock('@/lib/market/mappers/market.mapper', () => ({
  mapSpreeMarketsToStorefrontMarkets: server.mapMarkets,
}))

vi.mock('@/lib/market/api/list-markets-with-expanded-countries', () => ({
  listMarketsWithExpandedCountries: server.listMarketsWithExpandedCountries,
}))

vi.mock('@/lib/observability/report-error', () => ({
  reportError: server.reportError,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClient: server.getServerSpreeClient,
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

vi.mock('./get-product-summaries', () => ({
  getProductListing: server.getProductListing,
}))

const market: ResolvedMarket = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'US Dollar',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'mkt_1',
  marketName: 'US',
}

const validCategory = categoryResource({
  id: 'ctg_valid',
  name: 'Valid category',
  permalink: 'valid-category',
})

describe('catalog category listing response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.getServerSpreeClient.mockReturnValue(client)
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    server.isSyntheticCatalogRootCategory.mockReturnValue(false)
    server.mapHomeCategories.mockReturnValue([{ id: 'ctg_home' }])
    server.mapNavigationCategories.mockReturnValue([{ id: 'ctg_navigation' }])
    server.mapSummary.mockReturnValue({ id: 'ctg_sitemap' })
    server.mapMarkets.mockReturnValue([
      {
        countries: [{ country: 'us' }],
        currencyCode: 'USD',
        defaultLocale: 'en',
        locales: [],
      },
    ])
    server.getProductListing.mockResolvedValue({
      meta: { pages: 1 },
      products: [],
    })
    server.listMarketsWithExpandedCountries.mockResolvedValue({ data: [] })
    client.categories.list.mockResolvedValue({
      data: [validCategory],
      meta: { page: 1, pages: 1, count: 1, limit: 100, from: 1, to: 1 },
    })
  })

  it('validates home category resources before mapping', async () => {
    await expect(
      getHomeCategorySummariesForMarket({ market }),
    ).resolves.toEqual([{ id: 'ctg_home' }])

    expect(server.mapHomeCategories).toHaveBeenCalledWith([validCategory], 6)

    client.categories.list.mockResolvedValueOnce({
      data: [{ id: 'prod_wrong' }],
      meta: {},
    })

    await expect(getHomeCategorySummariesForMarket({ market })).rejects.toThrow(
      'not a category resource',
    )
    expect(server.mapHomeCategories).toHaveBeenCalledTimes(1)
  })

  it('fails closed before mapping a malformed home category list envelope', async () => {
    client.categories.list.mockResolvedValueOnce({ data: null })

    await expect(getHomeCategorySummariesForMarket({ market })).rejects.toThrow(
      'catalog list response is malformed',
    )
    expect(server.mapHomeCategories).not.toHaveBeenCalled()
  })

  it('validates navigation category resources before mapping', async () => {
    await expect(getNavigationCategoriesForMarket({ market })).resolves.toEqual(
      [{ id: 'ctg_navigation' }],
    )

    expect(server.mapNavigationCategories).toHaveBeenCalledWith(
      [validCategory],
      7,
    )

    client.categories.list.mockResolvedValueOnce({
      data: [{ id: undefined }],
      meta: {},
    })

    await expect(getNavigationCategoriesForMarket({ market })).rejects.toThrow(
      'not a category resource',
    )
    expect(server.mapNavigationCategories).toHaveBeenCalledTimes(1)
  })

  it('validates nested navigation category resources before mapping', async () => {
    client.categories.list.mockResolvedValueOnce({
      data: [
        categoryResource({
          children: [{ id: 'or_wrong', parent_id: 'ctg_parent' }],
          id: 'ctg_parent',
        }),
      ],
      meta: {},
    })

    await expect(getNavigationCategoriesForMarket({ market })).rejects.toThrow(
      'not a category resource',
    )
    expect(server.mapNavigationCategories).not.toHaveBeenCalled()
  })

  it('rejects a nested navigation category with another parent', async () => {
    client.categories.list.mockResolvedValueOnce({
      data: [
        categoryResource({
          children: [
            categoryResource({
              id: 'ctg_child',
              parent_id: 'ctg_other_parent',
            }),
          ],
          id: 'ctg_parent',
        }),
      ],
      meta: {},
    })

    await expect(getNavigationCategoriesForMarket({ market })).rejects.toThrow(
      'does not belong to its parent category',
    )
    expect(server.mapNavigationCategories).not.toHaveBeenCalled()
  })

  it('validates nested home category resources before mapping', async () => {
    client.categories.list.mockResolvedValueOnce({
      data: [
        categoryResource({
          children: [{ id: 'prod_wrong', parent_id: 'ctg_parent' }],
          id: 'ctg_parent',
        }),
      ],
      meta: {},
    })

    await expect(getHomeCategorySummariesForMarket({ market })).rejects.toThrow(
      'not a category resource',
    )
    expect(server.mapHomeCategories).not.toHaveBeenCalled()
  })

  it('drops malformed sitemap categories before summary mapping', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: [marketResource({ id: 'mkt_1' })],
    })
    client.categories.list.mockResolvedValueOnce({
      data: [{ id: 'or_wrong' }],
      meta: { pages: 1 },
    })

    await expect(getCatalogSitemapData()).resolves.toEqual([
      {
        brands: [],
        categories: [],
        country: 'us',
        locale: 'en',
        products: [],
      },
    ])

    expect(server.listMarketsWithExpandedCountries).toHaveBeenCalledWith(client)
    expect(server.mapSummary).not.toHaveBeenCalled()
    expect(server.reportError).toHaveBeenCalledWith({
      context: 'sitemap.us.en.categories',
      error: expect.objectContaining({
        message: 'The response is not a category resource.',
      }),
    })
  })

  it('reports malformed nested sitemap categories before summary mapping', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: [marketResource({ id: 'mkt_1' })],
    })
    client.categories.list.mockResolvedValueOnce({
      data: [
        categoryResource({
          children: [{ id: 'or_wrong', parent_id: 'ctg_parent' }],
          id: 'ctg_parent',
        }),
      ],
      meta: { pages: 1 },
    })

    await expect(getCatalogSitemapData()).resolves.toEqual([
      {
        brands: [],
        categories: [],
        country: 'us',
        locale: 'en',
        products: [],
      },
    ])

    expect(server.mapSummary).not.toHaveBeenCalled()
    expect(server.reportError).toHaveBeenCalledWith({
      context: 'sitemap.us.en.categories',
      error: expect.objectContaining({
        message: 'The response is not a category resource.',
      }),
    })
  })

  it('fails closed before mapping a category with an incomplete mapper shape', async () => {
    client.categories.list.mockResolvedValueOnce({
      data: [categoryResource({ name: undefined })],
      meta: { pages: 1 },
    })

    await expect(getHomeCategorySummariesForMarket({ market })).rejects.toThrow(
      'catalog category response is malformed',
    )
    expect(server.mapHomeCategories).not.toHaveBeenCalled()
  })

  it('reports malformed sitemap pagination before summary mapping', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: [marketResource({ id: 'mkt_1' })],
    })
    client.categories.list.mockResolvedValueOnce({
      data: [validCategory],
      meta: { pages: null },
    })

    await expect(getCatalogSitemapData()).resolves.toEqual([
      {
        brands: [],
        categories: [],
        country: 'us',
        locale: 'en',
        products: [],
      },
    ])

    expect(server.mapSummary).not.toHaveBeenCalled()
    expect(server.reportError).toHaveBeenCalledWith({
      context: 'sitemap.us.en.categories',
      error: expect.objectContaining({
        message: 'The catalog pagination metadata is malformed.',
      }),
    })
  })

  it('rejects malformed sitemap markets before market mapping', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: [{ id: 'prod_wrong' }],
    })

    await expect(getCatalogSitemapData()).rejects.toThrow(
      'not a market resource',
    )

    expect(server.mapMarkets).not.toHaveBeenCalled()
    expect(client.categories.list).not.toHaveBeenCalled()
  })

  it('rejects a malformed sitemap market list envelope before mapping', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: null,
    })

    await expect(getCatalogSitemapData()).rejects.toThrow(
      'market list response is malformed',
    )

    expect(server.mapMarkets).not.toHaveBeenCalled()
    expect(client.categories.list).not.toHaveBeenCalled()
  })
})
