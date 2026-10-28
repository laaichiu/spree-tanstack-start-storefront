import { formatCountryName, getMarketCollator } from './market-format'
import type {
  StorefrontCountryOption,
  StorefrontLocale,
  StorefrontMarket,
} from './market'

export function findMarket(
  marketOptions: readonly StorefrontMarket[],
  country: string,
): StorefrontMarket | null {
  const normalizedCountry = country.trim().toLowerCase()

  return (
    marketOptions.find((market) =>
      market.countries.some(
        (option) => option.country.trim().toLowerCase() === normalizedCountry,
      ),
    ) ?? null
  )
}

export function getCountryOptions(
  marketOptions: readonly StorefrontMarket[],
  locale = 'en',
): StorefrontCountryOption[] {
  const byCountry = new Map<string, StorefrontCountryOption>()

  for (const market of marketOptions) {
    for (const option of market.countries) {
      if (!byCountry.has(option.country)) {
        byCountry.set(option.country, option)
      }
    }
  }

  const collator = getMarketCollator(locale)
  return [...byCountry.values()]
    .map((option) => ({
      ...option,
      countryName: formatCountryName(option.country, locale),
    }))
    .sort((left, right) =>
      collator.compare(left.countryName, right.countryName),
    )
}

export function findCountryOption(
  countryOptions: readonly StorefrontCountryOption[],
  country: string,
): StorefrontCountryOption | null {
  return countryOptions.find((option) => option.country === country) ?? null
}

export function findMarketForCountryOption(
  marketOptions: readonly StorefrontMarket[],
  countryOption: StorefrontCountryOption | null,
): StorefrontMarket | null {
  if (!countryOption) {
    return null
  }

  return (
    marketOptions.find((option) => option.id === countryOption.marketId) ??
    findMarket(marketOptions, countryOption.country)
  )
}

export function findLocaleOption(
  localeOptions: readonly StorefrontLocale[],
  locale: string,
): StorefrontLocale | null {
  const normalizedBaseLocale = locale.split('-')[0]

  return (
    localeOptions.find((option) => option.code === locale) ??
    localeOptions.find(
      (option) => option.code.split('-')[0] === normalizedBaseLocale,
    ) ??
    null
  )
}

export function getValidLocaleForMarket(
  market: StorefrontMarket,
  locale: string,
): string {
  return (
    findLocaleOption(market.locales, locale)?.code ??
    market.locales.find((option) => option.code === market.defaultLocale)
      ?.code ??
    market.defaultLocale
  )
}
