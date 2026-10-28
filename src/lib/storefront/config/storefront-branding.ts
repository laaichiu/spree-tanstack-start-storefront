import { readPublicBuildEnv } from '@/lib/env/public'
import { translateMessage } from '@/lib/i18n/messages'
import { normalizeLocale } from '@/lib/core/market'

import { mapStorefrontBranding } from '../mappers/storefront-branding.mapper'
import type { StorefrontBranding } from '@/lib/storefront/contracts'

function getPublicStorefrontBrandingEnv() {
  return readPublicBuildEnv({
    VITE_STOREFRONT_NAME: import.meta.env.VITE_STOREFRONT_NAME,
    VITE_STOREFRONT_URL: import.meta.env.VITE_STOREFRONT_URL,
  })
}

export function getConfiguredStorefrontBranding(
  locale: string,
): StorefrontBranding {
  const normalizedLocale = normalizeLocale(locale)
  const publicEnv = getPublicStorefrontBrandingEnv()

  return mapStorefrontBranding({
    locale: normalizedLocale,
    // A generic Spree logo is not a safe fallback for a store named by the
    // merchant. Render the configured store name until Store API branding is
    // available, then use the logo returned by the backend.
    logoUrl: null,
    metaDescription: translateMessage(
      normalizedLocale,
      'branding.defaultDescription',
    ),
    name:
      publicEnv.storefrontName ??
      translateMessage(normalizedLocale, 'branding.defaultName'),
    seoTitle: null,
  })
}
