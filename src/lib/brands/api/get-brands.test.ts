// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BRAND_SEARCH } from '@/lib/brands/contracts'
import { getBrandProducts } from './get-brands'

const server = vi.hoisted(() => ({
  getBrandProductsForMarket: vi.fn(),
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

vi.mock('./get-brand-products.server', () => ({
  getBrandProductsForMarket: server.getBrandProductsForMarket,
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

describe('brand product server function input', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
  })

  it('accepts the normalized search with inactive filters', async () => {
    const listing = { filters: null, meta: {}, products: [] }
    server.getBrandProductsForMarket.mockResolvedValue(listing)

    await expect(
      getBrandProducts({
        data: {
          market: { country: 'us', locale: 'en' },
          search: DEFAULT_BRAND_SEARCH,
          sellerId: 'sel_Apple',
        },
      }),
    ).resolves.toBe(listing)

    expect(server.getBrandProductsForMarket).toHaveBeenCalledWith({
      market: resolvedMarket,
      search: DEFAULT_BRAND_SEARCH,
      sellerId: 'sel_Apple',
    })
  })
})
