import { describe, expect, it } from 'vitest'

import {
  getDefaultResolvedMarket,
  getMarketPath,
  replaceMarketPrefix,
  replaceMarketRedirectSearch,
  resolveMarketSelection,
} from './market'
import { formatCountryOptionLabel } from './market-format'
import { marketInputSchema } from './market-input'
import type { StorefrontMarket } from '../model/market'

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
        country: 'de',
        countryName: 'Germany',
        currencyCode: 'EUR',
        locale: 'de',
        marketId: 'mkt_eu',
        marketName: 'Europe',
      },
      {
        country: 'fr',
        countryName: 'France',
        currencyCode: 'EUR',
        locale: 'fr',
        marketId: 'mkt_eu',
        marketName: 'Europe',
      },
    ],
    currencyCode: 'EUR',
    currencyLabel: '€EUR',
    defaultCountry: 'de',
    defaultLocale: 'de',
    id: 'mkt_eu',
    isDefault: false,
    locales: [
      {
        code: 'de',
        label: 'German',
        shortLabel: 'DE',
      },
      {
        code: 'fr',
        label: 'French',
        shortLabel: 'FR',
      },
      {
        code: 'en',
        label: 'English',
        shortLabel: 'EN',
      },
    ],
    name: 'Europe',
  },
]

describe('market utilities', () => {
  it('resolves a supported country and locale to its currency', () => {
    const selection = resolveMarketSelection(marketOptions, {
      country: 'fr',
      locale: 'fr',
    })

    expect(selection.shouldRedirect).toBe(false)
    expect(selection.market).toMatchObject({
      country: 'fr',
      currencyCode: 'EUR',
      locale: 'fr',
    })
  })

  it('normalizes unsupported country and locale to the default market', () => {
    const selection = resolveMarketSelection(marketOptions, {
      country: 'unknown',
      locale: 'zz',
    })

    expect(selection.shouldRedirect).toBe(true)
    expect(selection.market).toMatchObject({
      country: 'us',
      currencyCode: 'USD',
      locale: 'en',
    })
  })

  it('builds and replaces market-prefixed paths', () => {
    expect(getMarketPath(getDefaultResolvedMarket())).toBe('/us/en')
    expect(
      replaceMarketPrefix('/us/en/products/coffee', {
        country: 'jp',
        locale: 'ja',
      }),
    ).toBe('/jp/ja/products/coffee')
  })

  it('updates a localized redirect when switching market preferences', () => {
    expect(
      replaceMarketRedirectSearch(
        '?redirect=%2Fus%2Fen%2Faccount',
        { country: 'us', locale: 'en' },
        { country: 'us', locale: 'de' },
      ),
    ).toBe('?redirect=%2Fus%2Fde%2Faccount')
  })

  it('preserves redirect details and unrelated search parameters', () => {
    expect(
      replaceMarketRedirectSearch(
        '?redirect=%2Fus%2Fen%2Fcheckout%2Fcart_123%3Fstep%3Dpayment%23form&source=email',
        { country: 'us', locale: 'en' },
        { country: 'de', locale: 'de' },
      ),
    ).toBe(
      '?redirect=%2Fde%2Fde%2Fcheckout%2Fcart_123%3Fstep%3Dpayment%23form&source=email',
    )
  })

  it('does not rewrite a redirect outside the current market prefix', () => {
    const search = '?redirect=https%3A%2F%2Fexample.com%2Faccount'

    expect(
      replaceMarketRedirectSearch(
        search,
        { country: 'us', locale: 'en' },
        { country: 'de', locale: 'de' },
      ),
    ).toBe(search)
  })

  it('keeps simple locale segments for country-specific currencies', () => {
    expect(
      resolveMarketSelection(marketOptions, {
        country: 'de',
        locale: 'en',
      }).market,
    ).toMatchObject({
      country: 'de',
      currencyCode: 'EUR',
      locale: 'en',
    })
  })

  it('formats country option labels with the currency symbol after the code', () => {
    expect(formatCountryOptionLabel(marketOptions[0].countries[0])).toBe(
      'United States USD $',
    )
  })

  it('accepts only the market selection at the server boundary', () => {
    expect(
      marketInputSchema.parse({
        country: 'US',
        currencyCode: 'JPY',
        locale: 'pt_BR',
        marketId: 'mkt_attacker',
      }),
    ).toEqual({
      country: 'US',
      locale: 'pt_BR',
    })

    expect(
      marketInputSchema.safeParse({
        country: '//evil.example',
        currencyCode: 'US dollars',
        locale: '../admin',
      }).success,
    ).toBe(false)
  })
})
