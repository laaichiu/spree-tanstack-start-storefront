import { normalizeLocale } from '@/lib/core/market'
import type { StorefrontBranding } from '@/lib/storefront/contracts'

type RouteMatchWithLoaderData = {
  loaderData?: unknown
}

function hasStorefrontBranding(
  value: unknown,
): value is { branding: StorefrontBranding } {
  if (!isRecord(value) || !Object.hasOwn(value, 'branding')) {
    return false
  }

  const branding = value.branding

  return (
    isRecord(branding) &&
    typeof branding.locale === 'string' &&
    typeof branding.name === 'string' &&
    branding.name.trim().length > 0 &&
    isNullableString(branding.logoUrl) &&
    isNullableString(branding.metaDescription) &&
    isNullableString(branding.seoTitle)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function getStorefrontBrandingFromMatches(
  matches: readonly RouteMatchWithLoaderData[],
  locale: string,
) {
  const requestedLocale = normalizeLocale(locale)

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const loaderData = matches[index]?.loaderData

    if (hasStorefrontBranding(loaderData)) {
      if (normalizeLocale(loaderData.branding.locale) === requestedLocale) {
        return loaderData.branding
      }
    }
  }

  return null
}
