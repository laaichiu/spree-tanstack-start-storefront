import type { StorefrontCountryOption } from './market'

export const DEFAULT_COUNTRY = 'us'
export const DEFAULT_LOCALE = 'en'
export const DEFAULT_CURRENCY_CODE = 'USD'

const COUNTRY_CODE_PATTERN = /^[a-z]{2}$/
const CURRENCY_CODE_PATTERN = /^[a-z]{3}$/
const displayNames = new Map<string, Intl.DisplayNames>()
const collators = new Map<string, Intl.Collator>()
const currencyFormatters = new Map<string, Intl.NumberFormat>()

const LOCALE_CODE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/

export function normalizeCountry(country: string | null | undefined) {
  const normalizedCountry = country?.trim().toLowerCase()

  return normalizedCountry || DEFAULT_COUNTRY
}

export function normalizeCurrencyCode(currencyCode: string | null | undefined) {
  return currencyCode?.trim().toUpperCase() || DEFAULT_CURRENCY_CODE
}

export function normalizeLocale(locale: string | null | undefined) {
  return locale?.trim().replace(/_/g, '-').toLowerCase() || DEFAULT_LOCALE
}

export function isCountryCode(value: string) {
  return COUNTRY_CODE_PATTERN.test(value.trim().toLowerCase())
}

export function isCurrencyCode(value: string) {
  return CURRENCY_CODE_PATTERN.test(value.trim().toLowerCase())
}

export function isLocaleCode(value: string) {
  return LOCALE_CODE_PATTERN.test(value.trim().replace(/_/g, '-').toLowerCase())
}

export function formatLocaleShortLabel(localeCode: string) {
  return normalizeLocale(localeCode).split('-')[0]?.toUpperCase() || 'EN'
}

function referenceName(
  code: string,
  locale: string,
  type: 'region' | 'language',
) {
  const key = `${normalizeLocale(locale)}:${type}`
  let names = displayNames.get(key)
  if (!names) {
    try {
      names = new Intl.DisplayNames([normalizeLocale(locale)], { type })
    } catch {
      names = new Intl.DisplayNames([DEFAULT_LOCALE], { type })
    }
    displayNames.set(key, names)
  }
  try {
    return names.of(code) || code
  } catch {
    return code
  }
}

export function getMarketCollator(locale = DEFAULT_LOCALE) {
  const key = normalizeLocale(locale)
  let collator = collators.get(key)
  if (!collator) {
    try {
      collator = new Intl.Collator(key)
    } catch {
      collator = new Intl.Collator(DEFAULT_LOCALE)
    }
    collators.set(key, collator)
  }
  return collator
}

export function formatCountryName(
  countryCode: string,
  locale = DEFAULT_LOCALE,
) {
  const code = countryCode.trim().toUpperCase()
  return referenceName(code, locale, 'region')
}

export function formatLocaleLabel(
  localeCode: string,
  readerLocale = DEFAULT_LOCALE,
) {
  return referenceName(normalizeLocale(localeCode), readerLocale, 'language')
}

export function formatCurrencyDisplay(
  currencyCode: string,
  locale = DEFAULT_LOCALE,
) {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode)

  try {
    const key = `${normalizeLocale(locale)}:${normalizedCurrency}`
    let formatter = currencyFormatters.get(key)
    if (!formatter) {
      formatter = new Intl.NumberFormat(normalizeLocale(locale), {
        currency: normalizedCurrency,
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        style: 'currency',
      })
      currencyFormatters.set(key, formatter)
    }
    const currencyToken = formatter
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value

    if (currencyToken && currencyToken !== normalizedCurrency) {
      return `${currencyToken}${normalizedCurrency}`
    }
  } catch {
    // Fall back to the raw currency code when Intl formatting fails.
  }

  return normalizedCurrency
}

function formatRegionCurrencyLabel(currencyCode: string, locale: string) {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode)
  const displayValue = formatCurrencyDisplay(normalizedCurrency, locale)
  const currencySymbol = displayValue.replace(normalizedCurrency, '').trim()

  return currencySymbol
    ? `${normalizedCurrency} ${currencySymbol}`
    : normalizedCurrency
}

export function formatCountryOptionLabel(
  option: StorefrontCountryOption,
  locale = DEFAULT_LOCALE,
) {
  const currencyLabel = formatRegionCurrencyLabel(option.currencyCode, locale)

  return currencyLabel
    ? `${formatCountryName(option.country, locale)} ${currencyLabel}`
    : formatCountryName(option.country, locale)
}
