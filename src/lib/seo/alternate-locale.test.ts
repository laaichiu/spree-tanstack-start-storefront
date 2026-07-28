import type { StorefrontMarket } from '@/lib/market/model/market'
import { describe, expect, it } from 'vitest'

import { buildAlternateLocaleLinks } from './alternate-locale'

const marketOptions: StorefrontMarket[] = [
  {
    countries: [
      {
        country: 'us',
        countryName: 'United States',
        currencyCode: 'USD',
        locale: 'en',
        marketId: 'market-us',
        marketName: 'United States',
      },
    ],
    currencyCode: 'USD',
    currencyLabel: '$USD',
    defaultCountry: 'us',
    defaultLocale: 'en',
    id: 'market-us',
    isDefault: true,
    locales: [{ code: 'en', label: 'English', shortLabel: 'EN' }],
    name: 'United States',
  },
  {
    countries: [
      {
        country: 'fr',
        countryName: 'France',
        currencyCode: 'EUR',
        locale: 'fr',
        marketId: 'market-fr',
        marketName: 'France',
      },
    ],
    currencyCode: 'EUR',
    currencyLabel: '€EUR',
    defaultCountry: 'fr',
    defaultLocale: 'fr',
    id: 'market-fr',
    isDefault: false,
    locales: [{ code: 'fr', label: 'French', shortLabel: 'FR' }],
    name: 'France',
  },
]

describe('alternate locale SEO links', () => {
  it('maps every supported market locale and adds x-default', () => {
    expect(
      buildAlternateLocaleLinks({
        marketOptions,
        path: '/us/en/products?page=2',
        storefrontUrl: 'https://shop.example.com',
      }),
    ).toEqual([
      {
        href: 'https://shop.example.com/us/en/products?page=2',
        hreflang: 'en-US',
      },
      {
        href: 'https://shop.example.com/fr/fr/products?page=2',
        hreflang: 'fr-FR',
      },
      {
        href: 'https://shop.example.com/us/en/products?page=2',
        hreflang: 'x-default',
      },
    ])
  })

  it('keeps query suffixes and lets canonical URLs remove hashes', () => {
    expect(
      buildAlternateLocaleLinks({
        marketOptions,
        path: '/us/en/products/coffee?sort=price#results',
        storefrontUrl: 'https://shop.example.com',
      }),
    ).toEqual([
      {
        href: 'https://shop.example.com/us/en/products/coffee?sort=price',
        hreflang: 'en-US',
      },
      {
        href: 'https://shop.example.com/fr/fr/products/coffee?sort=price',
        hreflang: 'fr-FR',
      },
      {
        href: 'https://shop.example.com/us/en/products/coffee?sort=price',
        hreflang: 'x-default',
      },
    ])
  })

  it('deduplicates the same hreflang deterministically', () => {
    expect(
      buildAlternateLocaleLinks({
        marketOptions: [
          marketOptions[0],
          {
            ...marketOptions[0],
            id: 'market-us-secondary',
            name: 'United States secondary',
          },
        ],
        path: '/us/en/products',
        storefrontUrl: 'https://shop.example.com',
      }),
    ).toEqual([
      {
        href: 'https://shop.example.com/us/en/products',
        hreflang: 'en-US',
      },
      {
        href: 'https://shop.example.com/us/en/products',
        hreflang: 'x-default',
      },
    ])
  })

  it('does not append a country twice to a regional locale', () => {
    expect(
      buildAlternateLocaleLinks({
        marketOptions: [
          {
            ...marketOptions[0],
            countries: [
              {
                ...marketOptions[0].countries[0],
                country: 'br',
              },
            ],
            defaultCountry: 'br',
            defaultLocale: 'pt-BR',
            locales: [{ code: 'pt-BR', label: 'Portuguese', shortLabel: 'PT' }],
          },
        ],
        path: '/us/en/products',
        storefrontUrl: 'https://shop.example.com',
      }),
    ).toEqual([
      {
        href: 'https://shop.example.com/br/pt-BR/products',
        hreflang: 'pt-BR',
      },
      {
        href: 'https://shop.example.com/br/pt-BR/products',
        hreflang: 'x-default',
      },
    ])
  })
})
