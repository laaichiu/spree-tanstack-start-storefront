import '@tanstack/react-start/server-only'

import { getConfiguredStorefrontBranding } from '../config/storefront-branding'
import type { StorefrontBranding } from '../model/storefront-branding'

export type StorefrontBrandingRequest = {
  locale: string
}

export async function getStorefrontBrandingForRequest({
  locale,
}: StorefrontBrandingRequest): Promise<StorefrontBranding> {
  return getConfiguredStorefrontBranding(locale)
}
