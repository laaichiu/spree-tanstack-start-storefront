import type {
  MarketSelectionInput,
  ResolvedMarket,
  StorefrontCountryOption,
  StorefrontLocale,
  StorefrontMarket,
} from '../model/market'
import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_LOCALE,
  formatCurrencyDisplay,
  formatLocaleLabel,
  formatLocaleShortLabel,
  normalizeCountry,
  normalizeCurrencyCode,
  normalizeLocale,
} from './market-format'

type MarketSelectionResult = {
  countryOptions: StorefrontCountryOption[]
  localeOptions: StorefrontLocale[]
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  shouldRedirect: boolean
}

export const FALLBACK_STOREFRONT_MARKETS: StorefrontMarket[] = [
  {
    countries: [
      {
        country: DEFAULT_COUNTRY,
        countryName: 'United States',
        currencyCode: DEFAULT_CURRENCY_CODE,
        locale: DEFAULT_LOCALE,
        marketId: null,
        marketName: 'United States',
      },
    ],
    currencyCode: DEFAULT_CURRENCY_CODE,
    currencyLabel: formatCurrencyDisplay(DEFAULT_CURRENCY_CODE),
    defaultCountry: DEFAULT_COUNTRY,
    defaultLocale: DEFAULT_LOCALE,
    id: null,
    isDefault: true,
    locales: [
      {
        code: DEFAULT_LOCALE,
        label: 'English',
        shortLabel: 'EN',
      },
    ],
    name: 'United States',
  },
]

function findLocaleOption(
  localeOptions: readonly StorefrontLocale[],
  locale: string,
) {
  const normalizedLocale = normalizeLocale(locale)
  const normalizedBaseLocale = normalizedLocale.split('-')[0]

  return (
    localeOptions.find((option) => option.code === normalizedLocale) ??
    localeOptions.find(
      (option) => option.code.split('-')[0] === normalizedBaseLocale,
    ) ??
    null
  )
}

export function findMarket(
  marketOptions: readonly StorefrontMarket[],
  country: string,
) {
  const normalizedCountry = normalizeCountry(country)

  return (
    marketOptions.find((market) =>
      market.countries.some((option) => option.country === normalizedCountry),
    ) ?? null
  )
}

export function getCountryOptions(
  marketOptions: readonly StorefrontMarket[] = FALLBACK_STOREFRONT_MARKETS,
) {
  const byCountry = new Map<string, StorefrontCountryOption>()

  for (const market of marketOptions) {
    for (const option of market.countries) {
      if (!byCountry.has(option.country)) {
        byCountry.set(option.country, option)
      }
    }
  }

  return [...byCountry.values()].sort((left, right) =>
    left.countryName.localeCompare(right.countryName),
  )
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
    findLocaleOption(fallbackMarket.locales, fallbackMarket.defaultLocale) ??
    (fallbackMarket.locales.length > 0
      ? fallbackMarket.locales[0]
      : FALLBACK_STOREFRONT_MARKETS[0].locales[0])

  return toResolvedMarket({
    country: fallbackCountry,
    locale: fallbackLocale,
    market: fallbackMarket,
  })
}

function toResolvedMarket({
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
    countryName: country.countryName,
    currencyCode: market.currencyCode,
    currencyLabel: market.currencyLabel,
    locale: locale.code,
    localeLabel: locale.label,
    localeShortLabel: locale.shortLabel,
    marketId: market.id,
    marketName: market.name,
  }
}

function resolveInputMarket(
  input: MarketSelectionInput,
): MarketSelectionResult {
  const country = normalizeCountry(input.country)
  const locale = normalizeLocale(input.locale)
  const currencyCode = normalizeCurrencyCode(input.currencyCode)
  const market: ResolvedMarket = {
    country,
    countryName: input.countryName ?? country.toUpperCase(),
    currencyCode,
    currencyLabel: input.currencyLabel ?? formatCurrencyDisplay(currencyCode),
    locale,
    localeLabel: input.localeLabel ?? formatLocaleLabel(locale),
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

function isStorefrontMarketOptions(
  value: MarketSelectionInput | readonly StorefrontMarket[],
): value is readonly StorefrontMarket[] {
  return Array.isArray(value)
}

export function resolveMarketSelection(
  input: MarketSelectionInput,
): MarketSelectionResult
export function resolveMarketSelection(
  marketOptions: readonly StorefrontMarket[],
  input: MarketSelectionInput,
): MarketSelectionResult
export function resolveMarketSelection(
  first: MarketSelectionInput | readonly StorefrontMarket[],
  second?: MarketSelectionInput,
): MarketSelectionResult {
  if (!isStorefrontMarketOptions(first)) {
    if (first.currencyCode) {
      return resolveInputMarket(first)
    }

    return resolveMarketSelection(FALLBACK_STOREFRONT_MARKETS, first)
  }

  const marketOptions = first.length ? first : FALLBACK_STOREFRONT_MARKETS
  const input = second

  if (!input) {
    const market = getDefaultResolvedMarket(marketOptions)

    return {
      countryOptions: getCountryOptions(marketOptions),
      localeOptions:
        findMarket(marketOptions, market.country)?.locales ??
        FALLBACK_STOREFRONT_MARKETS[0].locales,
      market,
      marketOptions: [...marketOptions],
      shouldRedirect: false,
    }
  }

  const normalizedCountry = normalizeCountry(input.country)
  const normalizedLocale = normalizeLocale(input.locale)
  const fallbackMarket = getDefaultResolvedMarket(marketOptions)
  const activeMarket = findMarket(marketOptions, normalizedCountry)

  if (!activeMarket) {
    const fallbackMarketOption =
      findMarket(marketOptions, fallbackMarket.country) ?? marketOptions[0]

    return {
      countryOptions: getCountryOptions(marketOptions),
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
    countryOptions: getCountryOptions(marketOptions),
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

export function getMarketPath(
  market: Pick<ResolvedMarket, 'country' | 'locale'>,
) {
  return `/${market.country}/${market.locale}`
}

export function replaceMarketPrefix(
  pathname: string,
  market: Pick<ResolvedMarket, 'country' | 'locale'>,
) {
  const segments = pathname.split('/').filter(Boolean)
  const suffix = segments.length >= 2 ? segments.slice(2) : segments
  const suffixPath = suffix.length ? `/${suffix.join('/')}` : ''

  return `${getMarketPath(market)}${suffixPath}`
}

export function replaceMarketRedirectSearch(
  search: string,
  currentMarket: Pick<ResolvedMarket, 'country' | 'locale'>,
  nextMarket: Pick<ResolvedMarket, 'country' | 'locale'>,
) {
  const searchParams = new URLSearchParams(search)
  const redirectTarget = searchParams.get('redirect')

  if (!redirectTarget) {
    return search
  }

  const currentMarketPath = getMarketPath(currentMarket)

  if (
    redirectTarget !== currentMarketPath &&
    !redirectTarget.startsWith(`${currentMarketPath}/`) &&
    !redirectTarget.startsWith(`${currentMarketPath}?`) &&
    !redirectTarget.startsWith(`${currentMarketPath}#`)
  ) {
    return search
  }

  searchParams.set(
    'redirect',
    `${getMarketPath(nextMarket)}${redirectTarget.slice(currentMarketPath.length)}`,
  )

  const nextSearch = searchParams.toString()

  return nextSearch ? `?${nextSearch}` : ''
}
