import type { Market as SpreeMarket } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { mapSpreeMarketsToStorefrontMarkets } from './market.mapper'

describe('market mapper', () => {
  it('maps Spree markets into normalized storefront market options', () => {
    const markets = [
      {
        countries: [
          {
            iso: 'US',
            iso3: 'USA',
            market: null,
            name: 'United States',
            states_required: true,
            zipcode_required: true,
          },
        ],
        currency: 'USD',
        default: true,
        default_locale: 'en',
        id: 'mkt_us',
        name: 'United States',
        supported_locales: ['en', 'es'],
        tax_inclusive: false,
      },
      {
        countries: [
          {
            iso: 'FR',
            iso3: 'FRA',
            market: null,
            name: 'France',
            states_required: false,
            zipcode_required: true,
          },
          {
            iso: 'DE',
            iso3: 'DEU',
            market: null,
            name: 'Germany',
            states_required: false,
            zipcode_required: true,
          },
        ],
        currency: 'EUR',
        default: false,
        default_locale: 'de',
        id: 'mkt_eu',
        name: 'Europe',
        supported_locales: ['de', 'fr', 'en'],
        tax_inclusive: true,
      },
    ] satisfies SpreeMarket[]

    expect(mapSpreeMarketsToStorefrontMarkets(markets, 'fr')).toMatchObject([
      {
        countries: [
          {
            country: 'us',
            currencyCode: 'USD',
            locale: 'en',
          },
        ],
        currencyCode: 'USD',
        defaultCountry: 'us',
        defaultLocale: 'en',
        id: 'mkt_us',
        isDefault: true,
        locales: [
          {
            code: 'en',
          },
          {
            code: 'es',
          },
        ],
      },
      {
        countries: [
          {
            country: 'fr',
            currencyCode: 'EUR',
            locale: 'fr',
          },
          {
            country: 'de',
            currencyCode: 'EUR',
            locale: 'fr',
          },
        ],
        currencyCode: 'EUR',
        defaultCountry: 'fr',
        defaultLocale: 'de',
        id: 'mkt_eu',
        isDefault: false,
      },
    ])
  })

  it('normalizes comma-separated supported locales from market responses', () => {
    const markets = [
      {
        countries: [
          {
            iso: 'DE',
            iso3: 'DEU',
            market: null,
            name: 'Germany',
            states_required: false,
            zipcode_required: true,
          },
        ],
        currency: 'EUR',
        default: false,
        default_locale: 'de',
        id: 'mkt_eu',
        name: 'Europe',
        supported_locales: 'es, fr, it' as unknown as string[],
        tax_inclusive: true,
      },
    ] satisfies SpreeMarket[]

    expect(mapSpreeMarketsToStorefrontMarkets(markets, 'en')).toMatchObject([
      {
        countries: [
          {
            country: 'de',
            currencyCode: 'EUR',
            locale: 'de',
          },
        ],
        defaultLocale: 'de',
        locales: [
          {
            code: 'de',
            label: 'German',
            shortLabel: 'DE',
          },
          {
            code: 'es',
            label: 'Spanish',
            shortLabel: 'ES',
          },
          {
            code: 'fr',
            label: 'French',
            shortLabel: 'FR',
          },
          {
            code: 'it',
            label: 'Italian',
            shortLabel: 'IT',
          },
        ],
      },
    ])
  })
})
