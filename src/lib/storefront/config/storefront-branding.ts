import { readPublicBuildEnv } from '@/lib/env/public'
import { translateMessage } from '@/lib/i18n/messages'
import { normalizeLocale } from '@/lib/market/utils/market-format'

import { mapStorefrontBranding } from '../mappers/storefront-branding.mapper'
import type { StorefrontBranding } from '../model/storefront-branding'

const DEFAULT_STOREFRONT_LOGO_PATH = '/spree.png'

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
    logoUrl: DEFAULT_STOREFRONT_LOGO_PATH,
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
