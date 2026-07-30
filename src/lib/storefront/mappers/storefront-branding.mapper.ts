import type { StorefrontBranding } from '../model/storefront-branding'

export type StorefrontBrandingInput = {
  locale: string
  logoUrl?: string | null
  metaDescription?: string | null
  name?: string | null
  seoTitle?: string | null
}

const FALLBACK_BRANDING_NAME = 'Store'

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized || null
}

function normalizePublicImageUrl(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('/') && !normalized.startsWith('//')) {
    return normalized
  }

  try {
    const url = new URL(normalized)

    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

export function mapStorefrontBranding({
  locale,
  logoUrl,
  metaDescription,
  name,
  seoTitle,
}: StorefrontBrandingInput): StorefrontBranding {
  return {
    locale,
    logoUrl: normalizePublicImageUrl(logoUrl),
    metaDescription: normalizeOptionalText(metaDescription),
    name: normalizeOptionalText(name) ?? FALLBACK_BRANDING_NAME,
    seoTitle: normalizeOptionalText(seoTitle),
  }
}
