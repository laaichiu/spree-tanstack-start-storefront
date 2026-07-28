import type { Country as SpreeCountry, Market as SpreeMarket } from '@spree/sdk'

import type { StorefrontCountryOption, StorefrontMarket } from '../model/market'
import {
  formatCurrencyDisplay,
  formatLocaleLabel,
  formatLocaleShortLabel,
  isLocaleCode,
  normalizeCountry,
  normalizeCurrencyCode,
  normalizeLocale,
} from '../utils/market-format'

type MarketLocaleShape = SpreeMarket & {
  defaultLocale?: unknown
  locales?: unknown
  supportedLocales?: unknown
}

function readLocaleStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(readLocaleStrings)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((locale) => locale.trim())
      .filter(Boolean)
  }

  return []
}

function readMarketDefaultLocale(market: SpreeMarket) {
  const shapedMarket = market as MarketLocaleShape
  const defaultLocale =
    typeof shapedMarket.default_locale === 'string'
      ? shapedMarket.default_locale
      : typeof shapedMarket.defaultLocale === 'string'
        ? shapedMarket.defaultLocale
        : undefined

  return defaultLocale
}

function readMarketSupportedLocales(market: SpreeMarket) {
  const shapedMarket = market as MarketLocaleShape

  return [
    ...readLocaleStrings(shapedMarket.supported_locales),
    ...readLocaleStrings(shapedMarket.supportedLocales),
    ...readLocaleStrings(shapedMarket.locales),
  ]
}

function getMarketLocaleCodes(market: SpreeMarket, fallbackLocale?: string) {
  const uniqueLocales = new Set<string>()
  const localeCandidates = [
    readMarketDefaultLocale(market),
    ...readMarketSupportedLocales(market),
  ]
  const locales: string[] = []

  for (const candidate of localeCandidates) {
    if (!candidate) {
      continue
    }

    const locale = normalizeLocale(candidate)

    if (!isLocaleCode(locale)) {
      continue
    }

    if (uniqueLocales.has(locale)) {
      continue
    }

    uniqueLocales.add(locale)
    locales.push(locale)
  }

  return locales.length ? locales : [normalizeLocale(fallbackLocale)]
}

function resolveMarketLocale(market: SpreeMarket, candidateLocale: string) {
  const normalizedCandidate = normalizeLocale(candidateLocale)
  const supportedLocales = getMarketLocaleCodes(market, candidateLocale)

  if (supportedLocales.includes(normalizedCandidate)) {
    return normalizedCandidate
  }

  const candidateBaseLocale = normalizedCandidate.split('-')[0]
  const baseLocaleMatch = supportedLocales.find(
    (locale) => locale.split('-')[0] === candidateBaseLocale,
  )

  return baseLocaleMatch ?? supportedLocales[0]
}

function mapSpreeCountryToStorefrontCountry({
  country,
  currentLocale,
  market,
}: {
  country: SpreeCountry
  currentLocale: string
  market: SpreeMarket
}): StorefrontCountryOption {
  return {
    country: normalizeCountry(country.iso),
    countryName: country.name,
    currencyCode: normalizeCurrencyCode(market.currency),
    locale: resolveMarketLocale(market, currentLocale),
    marketId: market.id,
    marketName: market.name,
  }
}

function mapSpreeMarketToLocaleOptions(market: SpreeMarket) {
  return getMarketLocaleCodes(market).map((locale) => ({
    code: locale,
    label: formatLocaleLabel(locale),
    shortLabel: formatLocaleShortLabel(locale),
  }))
}

function mapSpreeMarketToStorefrontMarket(
  market: SpreeMarket,
  currentLocale: string,
): StorefrontMarket {
  const countries = (market.countries ?? [])
    .map((country) =>
      mapSpreeCountryToStorefrontCountry({
        country,
        currentLocale,
        market,
      }),
    )
    .sort((left, right) => left.countryName.localeCompare(right.countryName))
  const firstConfiguredCountry = market.countries?.[0]?.iso
  const defaultCountry = normalizeCountry(
    firstConfiguredCountry ?? countries[0]?.country,
  )
  const defaultLocale = resolveMarketLocale(
    market,
    readMarketDefaultLocale(market) || currentLocale,
  )
  const currencyCode = normalizeCurrencyCode(market.currency)

  return {
    countries,
    currencyCode,
    currencyLabel: formatCurrencyDisplay(currencyCode),
    defaultCountry,
    defaultLocale,
    id: market.id,
    isDefault: market.default,
    locales: mapSpreeMarketToLocaleOptions(market),
    name: market.name,
  }
}

export function mapSpreeMarketsToStorefrontMarkets(
  markets: SpreeMarket[],
  currentLocale: string,
) {
  return markets
    .map((market) => mapSpreeMarketToStorefrontMarket(market, currentLocale))
    .filter((market) => market.countries.length > 0)
    .sort((left, right) => {
      if (left.isDefault !== right.isDefault) {
        return left.isDefault ? -1 : 1
      }

      return left.name.localeCompare(right.name)
    })
}
