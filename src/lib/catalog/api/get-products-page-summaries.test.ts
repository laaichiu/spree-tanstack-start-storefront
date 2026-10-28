// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProductsPageSummaries } from './get-products-page-summaries'

const server = vi.hoisted(() => ({
  getProductsPageSummariesForMarket: vi.fn(),
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

vi.mock('./get-products-page-summaries.server', () => ({
  getProductsPageSummariesForMarket: server.getProductsPageSummariesForMarket,
}))

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

describe('catalog products listing request market scope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
  })

  it('resolves market once before delegating the listing request', async () => {
    const listing = { filters: null, meta: {}, products: [] }
    server.getProductsPageSummariesForMarket.mockResolvedValue(listing)

    await expect(
      getProductsPageSummaries({
        data: {
          market: { country: 'us', locale: 'en' },
          query: 'shirt',
        },
      }),
    ).resolves.toBe(listing)

    expect(server.resolveServerMarket).toHaveBeenCalledTimes(1)
    expect(server.getProductsPageSummariesForMarket).toHaveBeenCalledWith({
      market: resolvedMarket,
      query: 'shirt',
    })
  })
})
