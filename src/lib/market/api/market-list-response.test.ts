// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FALLBACK_STOREFRONT_MARKETS } from '@/lib/market/utils/market-fallback'
import { marketResource } from '../utils/market-response.test-support'

import {
  getStorefrontMarketsForRequest,
  resolveStorefrontMarkets,
  StorefrontMarketsUnavailableError,
} from './get-storefront-markets.server'

const server = vi.hoisted(() => ({
  getServerSpreeClient: vi.fn(),
  listMarketsWithExpandedCountries: vi.fn(),
  mapMarkets: vi.fn(),
}))

const client = {}

vi.mock('@tanstack/react-start/server-only', () => ({}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClient: server.getServerSpreeClient,
}))

vi.mock('../mappers/market.mapper', () => ({
  mapSpreeMarketsToStorefrontMarkets: server.mapMarkets,
}))

vi.mock('./list-markets-with-expanded-countries', () => ({
  listMarketsWithExpandedCountries: server.listMarketsWithExpandedCountries,
}))

describe('storefront market list response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.getServerSpreeClient.mockReturnValue(client)
    server.mapMarkets.mockReturnValue([
      {
        countries: [{ country: 'us' }],
        currencyCode: 'USD',
        defaultCountry: 'us',
        defaultLocale: 'en',
        id: 'mkt_1',
        isDefault: true,
        locales: [],
        name: 'US',
      },
    ])
    server.listMarketsWithExpandedCountries.mockResolvedValue({
      data: [marketResource({ id: 'mkt_1' })],
    })
  })

  it('validates market resources before mapping the bootstrap response', async () => {
    await expect(
      getStorefrontMarketsForRequest({ country: 'us', locale: 'en' }),
    ).resolves.toHaveLength(1)

    expect(server.listMarketsWithExpandedCountries).toHaveBeenCalledWith(
      client,
      {
        country: 'US',
        locale: 'en',
      },
    )
    expect(server.mapMarkets).toHaveBeenCalledWith(
      [marketResource({ id: 'mkt_1' })],
      'en',
    )
  })

  it('uses the existing development fallback without mapping a malformed response', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: [{ id: 'prod_wrong' }],
    })

    await expect(getStorefrontMarketsForRequest()).resolves.toEqual(
      FALLBACK_STOREFRONT_MARKETS,
    )

    expect(server.mapMarkets).not.toHaveBeenCalled()
  })

  it('uses the existing development fallback for a malformed list envelope', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: null,
    })

    await expect(getStorefrontMarketsForRequest()).resolves.toEqual(
      FALLBACK_STOREFRONT_MARKETS,
    )

    expect(server.mapMarkets).not.toHaveBeenCalled()
  })

  it('uses the existing development fallback for an incomplete market resource', async () => {
    server.listMarketsWithExpandedCountries.mockResolvedValueOnce({
      data: [marketResource({ name: undefined })],
    })

    await expect(getStorefrontMarketsForRequest()).resolves.toEqual(
      FALLBACK_STOREFRONT_MARKETS,
    )

    expect(server.mapMarkets).not.toHaveBeenCalled()
  })

  it('keeps production market absence unavailable', () => {
    expect(() => resolveStorefrontMarkets([], { production: true })).toThrow(
      StorefrontMarketsUnavailableError,
    )
  })

  it('can disable the development fallback for server-verified requests', async () => {
    server.listMarketsWithExpandedCountries.mockRejectedValueOnce(
      new Error('market API offline'),
    )

    await expect(
      getStorefrontMarketsForRequest(
        { country: 'us', locale: 'en' },
        { allowDevelopmentFallback: false },
      ),
    ).rejects.toThrow(StorefrontMarketsUnavailableError)
  })

  it('does not resolve an empty strict market collection to the development fallback', () => {
    expect(() =>
      resolveStorefrontMarkets([], { allowDevelopmentFallback: false }),
    ).toThrow(StorefrontMarketsUnavailableError)
  })
})
