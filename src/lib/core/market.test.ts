import { describe, expect, it } from 'vitest'

import {
  findCountryOption,
  findLocaleOption,
  findMarket,
  findMarketForCountryOption,
  formatCountryOptionLabel,
  getCountryOptions,
  getValidLocaleForMarket,
  isCountryCode,
  isCurrencyCode,
  isLocaleCode,
  normalizeCountry,
  normalizeCurrencyCode,
  normalizeLocale,
} from './market'
import type { StorefrontCountryOption, StorefrontMarket } from './market'

const unitedStates: StorefrontCountryOption = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market_us',
  marketName: 'United States',
}

const canada: StorefrontCountryOption = {
  country: 'ca',
  countryName: 'Canada',
  currencyCode: 'CAD',
  locale: 'en-CA',
  marketId: 'market_ca',
  marketName: 'Canada',
}

const markets: StorefrontMarket[] = [
  {
    countries: [unitedStates],
    currencyCode: 'USD',
    currencyLabel: 'USD',
    defaultCountry: 'us',
    defaultLocale: 'en',
    id: 'market_us',
    isDefault: true,
    locales: [
      { code: 'en', label: 'English', shortLabel: 'EN' },
      { code: 'es-US', label: 'Spanish', shortLabel: 'ES' },
    ],
    name: 'United States',
  },
  {
    countries: [canada],
    currencyCode: 'CAD',
    currencyLabel: 'CAD',
    defaultCountry: 'ca',
    defaultLocale: 'en-CA',
    id: 'market_ca',
    isDefault: false,
    locales: [
      { code: 'en-CA', label: 'English', shortLabel: 'EN' },
      { code: 'fr-CA', label: 'French', shortLabel: 'FR' },
    ],
    name: 'Canada',
  },
]

describe('market contracts', () => {
  it('normalizes URL and API market values', () => {
    expect(normalizeCountry(' CA ')).toBe('ca')
    expect(normalizeCurrencyCode(' cad ')).toBe('CAD')
    expect(normalizeLocale(' FR_CA ')).toBe('fr-ca')
    expect(normalizeCountry(null)).toBe('us')
    expect(normalizeCurrencyCode(undefined)).toBe('USD')
    expect(normalizeLocale('')).toBe('en')
  })

  it('validates normalized country, currency and locale shapes', () => {
    expect(isCountryCode('NZ')).toBe(true)
    expect(isCountryCode('usa')).toBe(false)
    expect(isCurrencyCode('eur')).toBe(true)
    expect(isCurrencyCode('EU')).toBe(false)
    expect(isLocaleCode('zh_Hant')).toBe(true)
    expect(isLocaleCode('en--US')).toBe(false)
  })

  it('finds markets and country options by their normalized ownership', () => {
    expect(findMarket(markets, ' CA ')?.id).toBe('market_ca')
    expect(findMarket(markets, 'gb')).toBeNull()
    expect(findCountryOption([unitedStates, canada], 'ca')).toBe(canada)
  })

  it('deduplicates and sorts country choices', () => {
    const duplicateUnitedStates = {
      ...unitedStates,
      marketId: 'market_secondary',
    }

    expect(
      getCountryOptions([
        markets[0],
        markets[1],
        { ...markets[0], countries: [duplicateUnitedStates] },
      ]),
    ).toEqual([canada, unitedStates])
  })

  it('resolves a country option by market id before country fallback', () => {
    expect(findMarketForCountryOption(markets, canada)?.id).toBe('market_ca')
    expect(
      findMarketForCountryOption(markets, {
        ...unitedStates,
        marketId: 'missing_market',
      })?.id,
    ).toBe('market_us')
    expect(findMarketForCountryOption(markets, null)).toBeNull()
  })

  it('uses exact, base-language and default locale fallbacks', () => {
    expect(findLocaleOption(markets[1].locales, 'fr-CA')?.code).toBe('fr-CA')
    expect(findLocaleOption(markets[1].locales, 'fr-FR')?.code).toBe('fr-CA')
    expect(findLocaleOption(markets[1].locales, 'de-DE')).toBeNull()
    expect(getValidLocaleForMarket(markets[1], 'de-DE')).toBe('en-CA')
  })

  it('formats country options without hiding the currency code', () => {
    expect(formatCountryOptionLabel(unitedStates)).toContain('United States')
    expect(formatCountryOptionLabel(unitedStates)).toContain('USD')
  })
})
