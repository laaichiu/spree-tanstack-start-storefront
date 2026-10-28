import type {
  ResolvedMarket,
  StorefrontCountryOption,
  StorefrontLocale,
  StorefrontMarket,
} from '@/lib/core/market'
import {
  findLocaleOption,
  formatCountryName,
  formatCurrencyDisplay,
  formatLocaleLabel,
  normalizeLocale,
} from '@/lib/core/market'
import { FALLBACK_STOREFRONT_MARKETS } from './market-fallback'

export function toResolvedMarket({
  country,
  locale,
  market,
}: {
  country: StorefrontCountryOption
  locale: StorefrontLocale
  market: StorefrontMarket
}): ResolvedMarket {
  return {
    country: country.country,
    countryName: formatCountryName(country.country, locale.code),
    currencyCode: market.currencyCode,
    currencyLabel: formatCurrencyDisplay(market.currencyCode, locale.code),
    locale: locale.code,
    localeLabel: formatLocaleLabel(locale.code, locale.code),
    localeShortLabel: locale.shortLabel,
    marketId: market.id,
    marketName: market.name,
  }
}

export function getDefaultResolvedMarket(
  marketOptions: readonly StorefrontMarket[] = FALLBACK_STOREFRONT_MARKETS,
) {
  const fallbackMarket =
    marketOptions.find((market) => market.isDefault) ??
    (marketOptions.length > 0
      ? marketOptions[0]
      : FALLBACK_STOREFRONT_MARKETS[0])
  const fallbackCountry =
    fallbackMarket.countries.find(
      (country) => country.country === fallbackMarket.defaultCountry,
    ) ??
    (fallbackMarket.countries.length > 0
      ? fallbackMarket.countries[0]
      : FALLBACK_STOREFRONT_MARKETS[0].countries[0])
  const fallbackLocale =
    findLocaleOption(
      fallbackMarket.locales,
      normalizeLocale(fallbackMarket.defaultLocale),
    ) ??
    (fallbackMarket.locales.length > 0
      ? fallbackMarket.locales[0]
      : FALLBACK_STOREFRONT_MARKETS[0].locales[0])

  return toResolvedMarket({
    country: fallbackCountry,
    locale: fallbackLocale,
    market: fallbackMarket,
  })
}
