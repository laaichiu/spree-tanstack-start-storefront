/**
 * Framework-independent market metadata used by storefront contracts.
 *
 * Market selection, request context, cookie persistence, and server-side
 * market verification stay in the storefront runtime.
 */
export type StorefrontMarket = {
  countries: StorefrontCountryOption[]
  currencyCode: string
  currencyLabel: string
  defaultCountry: string
  defaultLocale: string
  id: string | null
  isDefault: boolean
  locales: StorefrontLocale[]
  name: string
}

export type StorefrontLocale = {
  code: string
  label: string
  shortLabel: string
}

export type StorefrontCountryOption = {
  country: string
  countryName: string
  currencyCode: string
  locale: string
  marketId: string | null
  marketName: string
}

export type ResolvedMarket = {
  country: string
  countryName: string
  currencyCode: string
  currencyLabel: string
  locale: string
  localeLabel: string
  localeShortLabel: string
  marketId: string | null
  marketName: string
}

/**
 * Framework-independent market selection input used by URL and preference
 * resolution. Request context, cookie persistence, and server verification
 * remain owned by the storefront runtime.
 */
export type MarketSelectionInput = {
  country: string
  countryName?: string
  currencyCode?: string
  currencyLabel?: string
  locale: string
  localeLabel?: string
  localeShortLabel?: string
  marketId?: string | null
  marketName?: string
}

export {
  findCountryOption,
  findLocaleOption,
  findMarket,
  findMarketForCountryOption,
  getCountryOptions,
  getValidLocaleForMarket,
} from './market-selection'
export {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_LOCALE,
  formatCountryName,
  getMarketCollator,
  formatCountryOptionLabel,
  formatCurrencyDisplay,
  formatLocaleLabel,
  formatLocaleShortLabel,
  isCountryCode,
  isCurrencyCode,
  isLocaleCode,
  normalizeCountry,
  normalizeCurrencyCode,
  normalizeLocale,
} from './market-format'
