import type { ResolvedMarket } from '@/lib/core/market'

export type MarketPath = Pick<ResolvedMarket, 'country' | 'locale'>

export function getMarketPath(market: MarketPath) {
  return `/${market.country}/${market.locale}`
}

export function replaceMarketPrefix(pathname: string, market: MarketPath) {
  const segments = pathname.split('/').filter(Boolean)
  const suffix = segments.length >= 2 ? segments.slice(2) : segments
  const suffixPath = suffix.length ? `/${suffix.join('/')}` : ''

  return `${getMarketPath(market)}${suffixPath}`
}

export function replaceMarketRedirectSearch(
  search: string,
  currentMarket: MarketPath,
  nextMarket: MarketPath,
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
