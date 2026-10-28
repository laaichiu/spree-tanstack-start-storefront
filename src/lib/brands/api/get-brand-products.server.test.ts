import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import {
  getProductListing,
  getProductListingFilters,
} from '@/lib/catalog/api/get-product-summaries'
import { toProductListParams } from '@/lib/catalog/api/product-listing-params'

import { getBrandProductsForMarket } from './get-brand-products.server'

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: vi.fn(),
}))

vi.mock('@/lib/catalog/api/get-product-summaries', () => ({
  getProductListing: vi.fn(),
  getProductListingFilters: vi.fn(),
}))

describe('getBrandProductsForMarket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProductListingFilters).mockResolvedValue(null as never)
  })

  it('keeps Seller filtering in the Store API request', async () => {
    const client = { products: { list: vi.fn() } }
    const listing = {
      meta: { count: 25, from: 1, limit: 24, page: 2, pages: 2, to: 25 },
      products: [{ id: 'prod_1' }],
    }
    vi.mocked(getServerSpreeClientForMarket).mockReturnValue(client as never)
    vi.mocked(getProductListing).mockResolvedValue(listing as never)

    await expect(
      getBrandProductsForMarket({
        market: { country: 'US', locale: 'en' } as never,
        search: {
          ...DEFAULT_PRODUCT_LISTING_SEARCH,
          page: 2,
          sort: 'price-desc',
        },
        sellerId: 'sel_Apple',
      }),
    ).resolves.toEqual({ ...listing, filters: null })

    expect(getProductListing).toHaveBeenCalledWith(
      client,
      toProductListParams(
        {
          ...DEFAULT_PRODUCT_LISTING_SEARCH,
          page: 2,
          sort: 'price-desc',
        },
        { extra: { seller_id_eq: 'sel_Apple' } },
      ),
      { includeVariants: true },
    )
    expect(getProductListingFilters).toHaveBeenCalledWith(
      client,
      {
        ...DEFAULT_PRODUCT_LISTING_SEARCH,
        page: 2,
        sort: 'price-desc',
      },
      { sellerId: 'sel_Apple' },
    )
  })
})
