import type {
  ResolvedMarket,
  StorefrontMarket,
} from '@/lib/market/model/market'
import {
  getMarketPath,
  resolveMarketSelection,
} from '@/lib/market/utils/market'
import {
  isCountryCode,
  isLocaleCode,
  normalizeCountry,
  normalizeLocale,
} from '@/lib/market/utils/market-format'

export const MARKET_COUNTRY_COOKIE = 'spree_country'
export const MARKET_LOCALE_COOKIE = 'spree_locale'

export const MARKET_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readCookieValue(cookieSource: string | undefined, cookieName: string) {
  if (!cookieSource) {
    return undefined
  }

  const tokens = cookieSource.split(';')

  for (const token of tokens) {
    const [name, ...rest] = token.trim().split('=')

    if (name === cookieName) {
      const rawValue = rest.join('=')

      if (!rawValue) {
        return undefined
      }

      try {
        return decodeURIComponent(rawValue)
      } catch {
        return undefined
      }
    }
  }

  return undefined
}

function toCookieAssignment(name: string, value: string) {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''

  return `${name}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${MARKET_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export function resolveMarketFromCookieSource(
  cookieSource?: string,
  marketOptions?: StorefrontMarket[],
) {
  const country = readCookieValue(cookieSource, MARKET_COUNTRY_COOKIE)
  const locale = readCookieValue(cookieSource, MARKET_LOCALE_COOKIE)

  if (!country || !locale) {
    return null
  }

  return marketOptions
    ? resolveMarketSelection(marketOptions, {
        country,
        locale,
      }).market
    : resolveMarketSelection({
        country,
        locale,
      }).market
}

export function getMarketPathFromCookieSource(cookieSource?: string) {
  const country = readCookieValue(cookieSource, MARKET_COUNTRY_COOKIE)
  const locale = readCookieValue(cookieSource, MARKET_LOCALE_COOKIE)

  if (!country || !locale) {
    return null
  }

  const normalizedCountry = normalizeCountry(country)
  const normalizedLocale = normalizeLocale(locale)

  if (!isCountryCode(normalizedCountry) || !isLocaleCode(normalizedLocale)) {
    return null
  }

  return getMarketPath({
    country: normalizedCountry,
    locale: normalizedLocale,
  })
}

export function syncMarketPreferenceCookies(market: ResolvedMarket) {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = toCookieAssignment(MARKET_COUNTRY_COOKIE, market.country)
  document.cookie = toCookieAssignment(MARKET_LOCALE_COOKIE, market.locale)
}
