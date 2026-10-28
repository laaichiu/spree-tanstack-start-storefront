import type {
  MarketSelectionInput,
  ResolvedMarket,
  StorefrontCountryOption,
  StorefrontLocale,
  StorefrontMarket,
} from '@/lib/core/market'
import {
  findLocaleOption,
  findMarket,
  formatCountryName,
  formatCurrencyDisplay,
  formatLocaleLabel,
  formatLocaleShortLabel,
  getCountryOptions,
  normalizeCountry,
  normalizeCurrencyCode,
  normalizeLocale,
} from '@/lib/core/market'
import { FALLBACK_STOREFRONT_MARKETS } from './market-fallback'
import { getDefaultResolvedMarket, toResolvedMarket } from './market-resolution'

type MarketSelectionResult = {
  countryOptions: StorefrontCountryOption[]
  localeOptions: StorefrontLocale[]
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  shouldRedirect: boolean
}

function resolveInputMarket(
  input: MarketSelectionInput,
): MarketSelectionResult {
  const country = normalizeCountry(input.country)
  const locale = normalizeLocale(input.locale)
  const currencyCode = normalizeCurrencyCode(input.currencyCode)
  const market: ResolvedMarket = {
    country,
    countryName: formatCountryName(country, locale),
    currencyCode,
    currencyLabel:
      input.currencyLabel ?? formatCurrencyDisplay(currencyCode, locale),
    locale,
    localeLabel: formatLocaleLabel(locale, locale),
    localeShortLabel: input.localeShortLabel ?? formatLocaleShortLabel(locale),
    marketId: input.marketId ?? null,
    marketName: input.marketName ?? input.countryName ?? country.toUpperCase(),
  }

  return {
    countryOptions: [],
    localeOptions: [],
    market,
    marketOptions: [],
    shouldRedirect: country !== input.country || locale !== input.locale,
  }
}

export function resolveMarketInput(input: MarketSelectionInput) {
  return input.currencyCode
    ? resolveInputMarket(input)
    : resolveMarketSelection(FALLBACK_STOREFRONT_MARKETS, input)
}

export function resolveMarketSelection(
  options: readonly StorefrontMarket[],
  input: MarketSelectionInput,
): MarketSelectionResult {
  const marketOptions = options.length ? options : FALLBACK_STOREFRONT_MARKETS

  const normalizedCountry = normalizeCountry(input.country)
  const normalizedLocale = normalizeLocale(input.locale)
  const fallbackMarket = getDefaultResolvedMarket(marketOptions)
  const activeMarket = findMarket(marketOptions, normalizedCountry)

  if (!activeMarket) {
    const fallbackMarketOption =
      findMarket(marketOptions, fallbackMarket.country) ?? marketOptions[0]

    return {
      countryOptions: getCountryOptions(marketOptions, fallbackMarket.locale),
      localeOptions: fallbackMarketOption.locales,
      market: fallbackMarket,
      marketOptions: [...marketOptions],
      shouldRedirect: true,
    }
  }

  const locale =
    findLocaleOption(activeMarket.locales, normalizedLocale) ??
    findLocaleOption(activeMarket.locales, activeMarket.defaultLocale) ??
    activeMarket.locales[0]
  const country =
    activeMarket.countries.find(
      (option) => option.country === normalizedCountry,
    ) ?? activeMarket.countries[0]

  return {
    countryOptions: getCountryOptions(marketOptions, normalizedLocale),
    localeOptions: activeMarket.locales,
    market: toResolvedMarket({
      country,
      locale,
      market: activeMarket,
    }),
    marketOptions: [...marketOptions],
    shouldRedirect:
      normalizedCountry !== input.country || normalizedLocale !== locale.code,
  }
}
