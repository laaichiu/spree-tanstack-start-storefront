import type { StorefrontBranding } from '@/lib/storefront/model/storefront-branding'

type RouteMatchWithLoaderData = {
  loaderData?: unknown
}

function hasStorefrontBranding(
  value: unknown,
): value is { branding: StorefrontBranding } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'branding' in value &&
    typeof value.branding === 'object' &&
    value.branding !== null &&
    'name' in value.branding &&
    typeof value.branding.name === 'string'
  )
}

export function getStorefrontBrandingFromMatches(
  matches: readonly RouteMatchWithLoaderData[],
) {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const loaderData = matches[index]?.loaderData

    if (hasStorefrontBranding(loaderData)) {
      return loaderData.branding
    }
  }

  return null
}
