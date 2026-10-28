// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCollectionListing } from './get-collection-listing'
import { categoryResource } from '../utils/catalog-category-response.test-support'

const server = vi.hoisted(() => ({
  getProductListing: vi.fn(),
  getProductListingFilters: vi.fn(),
  getServerSpreeClientForMarket: vi.fn(),
  mapCategory: vi.fn(),
  resolveServerMarket: vi.fn(),
}))

const client = {
  categories: {
    get: vi.fn(),
  },
}

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let inputValidator: unknown
    const builder = {
      handler: (handler: unknown) => (options: { data: unknown }) => {
        const validatedData =
          typeof inputValidator === 'function'
            ? (inputValidator as (data: unknown) => unknown)(options.data)
            : options.data

        return (handler as (options: { data: unknown }) => unknown)({
          data: validatedData,
        })
      },
      validator: (validator: unknown) => {
        inputValidator = validator
        return builder
      },
    }

    return builder
  },
  createServerOnlyFn: (handler: unknown) => handler,
}))

vi.mock('@/lib/catalog/api/get-product-summaries', () => ({
  getProductListing: server.getProductListing,
  getProductListingFilters: server.getProductListingFilters,
}))

vi.mock('@/lib/catalog/mappers/category.mapper', () => ({
  mapSpreeCategoryToDetail: server.mapCategory,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

const market = { country: 'us', locale: 'en' }

describe('catalog collection response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(market)
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    client.categories.get.mockResolvedValue(
      categoryResource({ id: 'ctg_requested' }),
    )
    server.getProductListing.mockResolvedValue({
      meta: { count: 0 },
      products: [],
    })
    server.getProductListingFilters.mockResolvedValue(null)
    server.mapCategory.mockReturnValue({ id: 'ctg_requested' })
  })

  it('maps a category whose id matches a prefixed collection lookup', async () => {
    await expect(
      getCollectionListing({
        data: { market, slug: 'ctg_requested' },
      }),
    ).resolves.toEqual({
      category: { id: 'ctg_requested' },
      filters: null,
      meta: { count: 0 },
      products: [],
    })

    expect(server.mapCategory).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ctg_requested' }),
    )
    expect(server.getProductListing).toHaveBeenCalled()
    expect(server.getProductListingFilters).toHaveBeenCalled()
  })

  it('fails closed before listing or mapping when a prefixed lookup returns another category', async () => {
    client.categories.get.mockResolvedValue(
      categoryResource({ id: 'ctg_other' }),
    )

    await expect(
      getCollectionListing({
        data: { market, slug: 'ctg_requested' },
      }),
    ).rejects.toThrow('does not match the requested category')

    expect(server.getProductListing).not.toHaveBeenCalled()
    expect(server.getProductListingFilters).not.toHaveBeenCalled()
    expect(server.mapCategory).not.toHaveBeenCalled()
  })

  it('fails closed before listing or mapping when a slug lookup returns another resource', async () => {
    client.categories.get.mockResolvedValue({ id: 'or_order' })

    await expect(
      getCollectionListing({
        data: { market, slug: 'summer-collection' },
      }),
    ).rejects.toThrow('not a category resource')

    expect(server.getProductListing).not.toHaveBeenCalled()
    expect(server.getProductListingFilters).not.toHaveBeenCalled()
    expect(server.mapCategory).not.toHaveBeenCalled()
  })

  it('fails closed before listing or mapping when a category ancestor is another resource', async () => {
    client.categories.get.mockResolvedValue(
      categoryResource({
        ancestors: [{ id: 'or_order' }],
        id: 'ctg_requested',
      }),
    )

    await expect(
      getCollectionListing({
        data: { market, slug: 'ctg_requested' },
      }),
    ).rejects.toThrow('not a category resource')

    expect(server.getProductListing).not.toHaveBeenCalled()
    expect(server.getProductListingFilters).not.toHaveBeenCalled()
    expect(server.mapCategory).not.toHaveBeenCalled()
  })

  it('keeps permalink lookups compatible with locale fallback responses', async () => {
    client.categories.get.mockResolvedValue(
      categoryResource({ id: 'ctg_localized' }),
    )

    await expect(
      getCollectionListing({
        data: { market, slug: 'summer-collection' },
      }),
    ).resolves.toMatchObject({
      category: { id: 'ctg_requested' },
    })

    expect(server.mapCategory).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ctg_localized' }),
    )
  })

  it('fails closed before listing or mapping a category with an incomplete mapper shape', async () => {
    client.categories.get.mockResolvedValue(
      categoryResource({ id: 'ctg_requested', permalink: undefined }),
    )

    await expect(
      getCollectionListing({
        data: { market, slug: 'ctg_requested' },
      }),
    ).rejects.toThrow('catalog category response is malformed')

    expect(server.getProductListing).not.toHaveBeenCalled()
    expect(server.getProductListingFilters).not.toHaveBeenCalled()
    expect(server.mapCategory).not.toHaveBeenCalled()
  })
})
