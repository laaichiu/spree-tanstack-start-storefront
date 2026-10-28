import { getConfiguredStorefrontBranding } from '@/lib/storefront/config/storefront-branding'
import { getStorefrontBrandingFromMatches } from './storefront-branding-loader'
import { buildSeoHead } from './seo-head'
import { buildPageTitle, resolveSeoDescription } from './seo-text'
import type {
  SeoAlternateLink,
  SeoMetaInput,
  StructuredData,
} from './seo-types'

export const siteSeo = {
  socialImagePath: '/hero-1600.webp',
}

type StorefrontSeoInput = Omit<SeoMetaInput, 'description' | 'title'> & {
  alternateLinks?: readonly SeoAlternateLink[]
  description?: string | null
  fallbackDescription?: string | null
  locale: string
  matches: readonly { loaderData?: unknown }[]
  preferStoreSeo?: boolean
  structuredData?: StructuredData[]
  title: string
}

export function buildStorefrontSeoHead({
  fallbackDescription,
  locale,
  matches,
  preferStoreSeo = false,
  title,
  ...input
}: StorefrontSeoInput) {
  const branding =
    getStorefrontBrandingFromMatches(matches) ??
    getConfiguredStorefrontBranding(locale)
  const pageDescription = preferStoreSeo
    ? (branding.metaDescription ?? input.description)
    : input.description
  const seoTitle = preferStoreSeo
    ? (branding.seoTitle ?? buildPageTitle(title, branding.name))
    : buildPageTitle(title, branding.name)

  return buildSeoHead({
    ...input,
    description: resolveSeoDescription({
      fallbackDescription,
      pageDescription,
      storeDescription: preferStoreSeo
        ? input.description
        : branding.metaDescription,
    }),
    title: seoTitle,
  })
}
