import { describe, expect, it } from 'vitest'

import {
  MARKET_COUNTRY_COOKIE,
  MARKET_LOCALE_COOKIE,
  getMarketPathFromCookieSource,
  resolveMarketFromCookieSource,
} from './market-cookie'
import type { StorefrontMarket } from '@/lib/market/model/market'

const marketOptions: StorefrontMarket[] = [
  {
    countries: [
      {
        country: 'us',
        countryName: 'United States',
        currencyCode: 'USD',
        locale: 'en',
        marketId: 'mkt_us',
        marketName: 'United States',
      },
    ],
    currencyCode: 'USD',
    currencyLabel: '$USD',
    defaultCountry: 'us',
    defaultLocale: 'en',
    id: 'mkt_us',
    isDefault: true,
    locales: [
      {
        code: 'en',
        label: 'English',
        shortLabel: 'EN',
      },
    ],
    name: 'United States',
  },
  {
    countries: [
      {
        country: 'jp',
        countryName: 'Japan',
        currencyCode: 'JPY',
        locale: 'ja',
        marketId: 'mkt_jp',
        marketName: 'Japan',
      },
    ],
    currencyCode: 'JPY',
    currencyLabel: '¥JPY',
    defaultCountry: 'jp',
    defaultLocale: 'ja',
    id: 'mkt_jp',
    isDefault: false,
    locales: [
      {
        code: 'ja',
        label: 'Japanese',
        shortLabel: 'JA',
      },
      {
        code: 'en',
        label: 'English',
        shortLabel: 'EN',
      },
    ],
    name: 'Japan',
  },
]

describe('market cookie helpers', () => {
  it('reads and normalizes URL encoded cookie values', () => {
    expect(
      getMarketPathFromCookieSource(
        `${MARKET_COUNTRY_COOKIE}=br; ${MARKET_LOCALE_COOKIE}=pt%2DBR`,
      ),
    ).toBe('/br/pt-br')
  })

  it('ignores malformed URL encoding instead of throwing', () => {
    expect(
      getMarketPathFromCookieSource(
        `${MARKET_COUNTRY_COOKIE}=jp; ${MARKET_LOCALE_COOKIE}=%E0%A4%A`,
      ),
    ).toBe(null)
  })

  it('resolves a preferred market from cookies without hardcoding one country', () => {
    const market = resolveMarketFromCookieSource(
      `${MARKET_COUNTRY_COOKIE}=jp; ${MARKET_LOCALE_COOKIE}=ja`,
      marketOptions,
    )

    expect(market).toMatchObject({
      country: 'jp',
      currencyCode: 'JPY',
      locale: 'ja',
    })
  })

  it('supports language and currency independently for a market', () => {
    const market = resolveMarketFromCookieSource(
      `${MARKET_COUNTRY_COOKIE}=jp; ${MARKET_LOCALE_COOKIE}=en`,
      marketOptions,
    )

    expect(market).toMatchObject({
      country: 'jp',
      currencyCode: 'JPY',
      locale: 'en',
    })
  })

  it('builds a redirect path from preference cookies without market data', () => {
    expect(
      getMarketPathFromCookieSource(
        `${MARKET_COUNTRY_COOKIE}=uy; ${MARKET_LOCALE_COOKIE}=es`,
      ),
    ).toBe('/uy/es')
  })

  it('ignores incomplete cookie preferences', () => {
    expect(resolveMarketFromCookieSource(`${MARKET_COUNTRY_COOKIE}=fr`)).toBe(
      null,
    )
    expect(getMarketPathFromCookieSource(`${MARKET_COUNTRY_COOKIE}=fr`)).toBe(
      null,
    )
  })

  it('rejects invalid market path segments from client-writable cookies', () => {
    expect(
      getMarketPathFromCookieSource(
        `${MARKET_COUNTRY_COOKIE}=%2F%2Fevil.example; ${MARKET_LOCALE_COOKIE}=en`,
      ),
    ).toBe(null)
    expect(
      getMarketPathFromCookieSource(
        `${MARKET_COUNTRY_COOKIE}=us; ${MARKET_LOCALE_COOKIE}=..%2Fadmin`,
      ),
    ).toBe(null)
  })
})
