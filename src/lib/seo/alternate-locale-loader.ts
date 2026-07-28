import type { StorefrontMarket } from '@/lib/market/model/market'

type RouteMatchWithLoaderData = {
  loaderData?: unknown
}

function hasMarketOptions(
  value: unknown,
): value is { marketOptions: StorefrontMarket[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'marketOptions' in value &&
    Array.isArray(value.marketOptions)
  )
}

export function getStorefrontMarketOptionsFromMatches(
  matches: readonly RouteMatchWithLoaderData[],
) {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const loaderData = matches[index]?.loaderData

    if (hasMarketOptions(loaderData)) {
      return loaderData.marketOptions
    }
  }

  return []
}
