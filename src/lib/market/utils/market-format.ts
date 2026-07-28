import type { StorefrontCountryOption } from '../model/market'

export const DEFAULT_COUNTRY = 'us'
export const DEFAULT_LOCALE = 'en'
export const DEFAULT_CURRENCY_CODE = 'USD'

const COUNTRY_CODE_PATTERN = /^[a-z]{2}$/
const CURRENCY_CODE_PATTERN = /^[a-z]{3}$/
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

export function countryToFlag(countryCode: string) {
  const code = countryCode.trim().toUpperCase()

  if (!/^[A-Z]{2}$/.test(code)) return ''

  const firstCodePoint = code.charCodeAt(0) - 65 + 0x1f1e6
  const secondCodePoint = code.charCodeAt(1) - 65 + 0x1f1e6

  return String.fromCodePoint(firstCodePoint, secondCodePoint)
}

export function formatLocaleShortLabel(localeCode: string) {
  return normalizeLocale(localeCode).split('-')[0]?.toUpperCase() || 'EN'
}

export function formatLocaleLabel(localeCode: string) {
  const normalizedLocale = normalizeLocale(localeCode)

  try {
    const displayName = new Intl.DisplayNames(['en'], {
      type: 'language',
    }).of(normalizedLocale)

    if (displayName) return displayName
  } catch {
    // Fall back to the normalized locale code below.
  }

  return formatLocaleShortLabel(normalizedLocale)
}

export function formatCurrencyDisplay(currencyCode: string) {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode)

  try {
    const currencyToken = new Intl.NumberFormat('en', {
      currency: normalizedCurrency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: 'currency',
    })
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

function formatRegionCurrencyLabel(currencyCode: string) {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode)
  const displayValue = formatCurrencyDisplay(normalizedCurrency)
  const currencySymbol = displayValue.replace(normalizedCurrency, '').trim()

  return currencySymbol
    ? `${normalizedCurrency} ${currencySymbol}`
    : normalizedCurrency
}

export function formatCountryOptionLabel(option: StorefrontCountryOption) {
  const currencyLabel = formatRegionCurrencyLabel(option.currencyCode)

  return currencyLabel
    ? `${option.countryName} ${currencyLabel}`
    : option.countryName
}
