// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reportError } from '@/lib/observability/report-error'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { getBrandProductsForMarket } from '@/lib/brands/api/get-brand-products.server'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type { ResolvedMarket } from '@/lib/core/market'
import { CatalogProductFiltersResponseTypeMismatchError } from '../mappers/product-filters-response'
import { categoryResource } from '../utils/catalog-category-response.test-support'
import { getProductsPageSummariesForMarket } from './get-products-page-summaries.server'
import { getCollectionListingForMarket } from './get-collection-listing.server'
import {
  getProductListing,
  getProductListingFilters,
} from './get-product-summaries'

vi.mock('@tanstack/react-start/server-only', () => ({}))
vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: vi.fn(),
}))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn() }))
vi.mock('./get-product-summaries', () => ({
  getProductListing: vi.fn(),
  getProductListingFilters: vi.fn(),
}))

const market: ResolvedMarket = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'USD',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'mkt_us',
  marketName: 'United States',
}
const listing = {
  products: [],
  meta: { count: 0, page: 1, pages: 0, limit: 24, from: 0, to: 0 },
}
const contexts = [
  {
    name: 'products',
    context: 'products.list.filters',
    load: () => getProductsPageSummariesForMarket({ market }),
  },
  {
    name: 'collection',
    context: 'products.collection.filters',
    load: () =>
      getCollectionListingForMarket({ market, slug: 'ctg_requested' }),
  },
  {
    name: 'brand',
    context: 'brands.products.filters',
    load: () =>
      getBrandProductsForMarket({
        market,
        sellerId: 'sel_fixture',
        search: DEFAULT_PRODUCT_LISTING_SEARCH,
      }),
  },
]

describe('optional catalog filter failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSpreeClientForMarket).mockReturnValue({
      categories: {
        get: vi
          .fn()
          .mockResolvedValue(categoryResource({ id: 'ctg_requested' })),
      },
    } as never)
    vi.mocked(getProductListing).mockResolvedValue(listing)
  })
  for (const { name, context, load } of contexts) {
    it.each([
      new CatalogProductFiltersResponseTypeMismatchError(),
      Object.assign(new Error('Upstream unavailable'), { status: 503 }),
    ])(
      `${name}: preserves products and reports unavailable filters: %s`,
      async (error) => {
        vi.mocked(getProductListingFilters).mockRejectedValue(error)
        const result = await load()
        expect(result.products).toBe(listing.products)
        expect(result.filters).toBeNull()
        expect(reportError).toHaveBeenCalledOnce()
        expect(reportError).toHaveBeenCalledWith({ context, error })
      },
    )
  }
})
