import type { StorefrontMarket } from '@/lib/market/model/market'
import {
  normalizeCountry,
  normalizeLocale,
} from '@/lib/market/utils/market-format'

import { buildCanonicalUrl } from './site-seo'
import type { SeoAlternateLink } from './site-seo'

function formatHreflang(locale: string, country: string) {
  const localeParts = normalizeLocale(locale).split('-')
  const formattedLocale = localeParts
    .map((part, index) => {
      if (index === 0) return part
      if (part.length === 2) return part.toUpperCase()
      if (part.length === 4) {
        return `${part[0].toUpperCase()}${part.slice(1)}`
      }
      return part
    })
    .join('-')
  const countryCode = normalizeCountry(country).toUpperCase()
  const hasRegion = localeParts.some(
    (part, index) => index > 0 && part.length === 2,
  )

  return hasRegion ? formattedLocale : `${formattedLocale}-${countryCode}`
}

function replaceMarketPrefix(path: string, country: string, locale: string) {
  const suffixIndex = path.search(/[?#]/)
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex)
  const segments = pathname.split('/').filter(Boolean)
  const resourceSegments = segments.length >= 2 ? segments.slice(2) : segments
  const nextSegments = [country, locale, ...resourceSegments]

  return `/${nextSegments.join('/')}${suffix}`
}

function getDefaultMarket(
  markets: readonly StorefrontMarket[],
): StorefrontMarket | null {
  return markets.find((market) => market.isDefault) ?? markets.at(0) ?? null
}

function getDefaultMarketPath(market: StorefrontMarket, path: string) {
  const country =
    market.countries.find(
      (option) =>
        normalizeCountry(option.country) ===
        normalizeCountry(market.defaultCountry),
    ) ?? market.countries.at(0)
  const locale =
    market.locales.find(
      (option) =>
        normalizeLocale(option.code) === normalizeLocale(market.defaultLocale),
    ) ?? market.locales.at(0)

  return country && locale
    ? replaceMarketPrefix(path, country.country, locale.code)
    : null
}

function createAlternateLocaleCandidates(
  marketOptions: readonly StorefrontMarket[],
  path: string,
  storefrontUrl?: string,
) {
  return marketOptions.flatMap((market) =>
    market.countries.flatMap((country) =>
      market.locales.flatMap((locale) => {
        const hreflang = formatHreflang(locale.code, country.country)
        const href = buildCanonicalUrl(
          replaceMarketPrefix(path, country.country, locale.code),
          storefrontUrl,
        )

        return href ? [{ href, hreflang }] : []
      }),
    ),
  )
}

function deduplicateAlternateLocaleLinks(
  candidates: readonly SeoAlternateLink[],
) {
  const linksByLanguage = new Map<string, SeoAlternateLink>()

  for (const candidate of candidates) {
    if (!linksByLanguage.has(candidate.hreflang)) {
      linksByLanguage.set(candidate.hreflang, candidate)
    }
  }

  return [...linksByLanguage.values()].sort((left, right) =>
    left.hreflang.localeCompare(right.hreflang),
  )
}

export function buildAlternateLocaleLinks({
  marketOptions,
  path,
  storefrontUrl,
}: {
  marketOptions: readonly StorefrontMarket[]
  path: string
  storefrontUrl?: string
}): SeoAlternateLink[] {
  const defaultMarket = getDefaultMarket(marketOptions)
  const defaultPath = defaultMarket
    ? getDefaultMarketPath(defaultMarket, path)
    : null
  const defaultHref = defaultPath
    ? buildCanonicalUrl(defaultPath, storefrontUrl)
    : null

  return [
    ...deduplicateAlternateLocaleLinks(
      createAlternateLocaleCandidates(marketOptions, path, storefrontUrl),
    ),
    ...(defaultHref ? [{ href: defaultHref, hreflang: 'x-default' }] : []),
  ]
}
