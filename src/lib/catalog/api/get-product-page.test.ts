// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import { getProductPage } from './get-product-page'
import { loadProductPage } from './get-product-page-loader'

const server = vi.hoisted(() => ({
  loadProductPageForMarket: vi.fn(),
  resolveServerMarket: vi.fn(),
}))

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

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('./get-product-page.server', () => ({
  loadProductPageForMarket: server.loadProductPageForMarket,
}))

describe('catalog product page identity handoff', () => {
  it('loads reviews with the canonical product id returned by the product mapper', async () => {
    const product = {
      categoryBreadcrumbs: [],
      id: 'prod_canonical',
    } as never
    const loaders = {
      loadProduct: vi.fn().mockResolvedValue(product),
      loadRelatedProducts: vi.fn(),
      loadReviews: vi.fn().mockResolvedValue({ status: 'unavailable' }),
      reportError: vi.fn(),
    }

    await expect(
      loadProductPage(
        {
          market: { country: 'us', locale: 'en' },
          slug: 'localized-product-slug',
        },
        loaders,
      ),
    ).resolves.toMatchObject({
      product,
      relatedProducts: [],
      reviews: { status: 'unavailable' },
    })

    expect(loaders.loadReviews).toHaveBeenCalledWith({
      market: { country: 'us', locale: 'en' },
      productId: 'prod_canonical',
    })
  })

  it('resolves the market once before loading the complete page', async () => {
    const resolvedMarket = {
      country: 'us',
      countryName: 'United States',
      currencyCode: 'USD',
      currencyLabel: 'US Dollar',
      locale: 'en',
      localeLabel: 'English',
      localeShortLabel: 'EN',
      marketId: 'market_us',
      marketName: 'United States',
    }
    const page = { product: { id: 'prod_us' } }
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
    server.loadProductPageForMarket.mockResolvedValue(page)

    await expect(
      getProductPage({
        data: {
          market: { country: 'us', locale: 'en' },
          slug: 'summer-shirt',
        },
      }),
    ).resolves.toBe(page)

    expect(server.resolveServerMarket).toHaveBeenCalledTimes(1)
    expect(server.loadProductPageForMarket).toHaveBeenCalledWith({
      market: resolvedMarket,
      slug: 'summer-shirt',
    })
  })
})
