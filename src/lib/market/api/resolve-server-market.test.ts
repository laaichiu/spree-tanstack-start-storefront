// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import { resolveServerMarket } from './resolve-server-market'

const getStorefrontMarketsForRequest = vi.fn()

vi.mock('./get-storefront-markets.server', () => ({
  StorefrontMarketsUnavailableError: class StorefrontMarketsUnavailableError extends Error {
    constructor() {
      super('Storefront markets are unavailable.')
    }
  },
  getStorefrontMarketsForRequest,
}))

describe('server market resolution', () => {
  it('disables the development fallback before resolving commerce context', async () => {
    getStorefrontMarketsForRequest.mockResolvedValueOnce([
      {
        countries: [
          {
            country: 'us',
            countryName: 'United States',
            currencyCode: 'USD',
            locale: 'en',
            marketId: 'mkt_us',
            marketName: 'US',
          },
        ],
        currencyCode: 'USD',
        currencyLabel: 'USD',
        defaultCountry: 'us',
        defaultLocale: 'en',
        id: 'mkt_us',
        isDefault: true,
        locales: [{ code: 'en', label: 'English', shortLabel: 'EN' }],
        name: 'US',
      },
    ])

    await expect(
      resolveServerMarket({ country: 'us', locale: 'en' }),
    ).resolves.toMatchObject({
      country: 'us',
      currencyCode: 'USD',
      locale: 'en',
      marketId: 'mkt_us',
    })

    expect(getStorefrontMarketsForRequest).toHaveBeenCalledWith(
      { country: 'us', locale: 'en' },
      { allowDevelopmentFallback: false },
    )
  })

  it('fails closed if a strict market reader unexpectedly returns no options', async () => {
    getStorefrontMarketsForRequest.mockResolvedValueOnce([])

    await expect(
      resolveServerMarket({ country: 'us', locale: 'en' }),
    ).rejects.toThrow('Storefront markets are unavailable.')
  })
})
