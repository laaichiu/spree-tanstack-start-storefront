import '@tanstack/react-start/server-only'

import { storefrontBrandNavigation } from '@/config/navigation'
import type { ResolvedMarket } from '@/lib/core/market'
import type {
  BrandNavigation,
  BrandNavigationConfig,
  BrandNavigationItem,
} from '@/lib/brands/contracts/brand-navigation'
import { reportError } from '@/lib/observability/report-error'

import { getBrandForMarket, hasBrandsForMarket } from './get-brands.server'

export async function getBrandNavigationForMarket({
  configuration = storefrontBrandNavigation,
  market,
}: {
  configuration?: BrandNavigationConfig
  market: ResolvedMarket
}): Promise<BrandNavigation> {
  const slugs = [
    ...new Set([
      ...configuration.slugs,
      ...(configuration.featuredSlug ? [configuration.featuredSlug] : []),
    ]),
  ]

  // Resolve only the curated brands, rather than loading the full directory
  // into every page's shell. Shared list/spotlight entries use one request.
  const [hasBrands, entries] = await Promise.all([
    hasBrandsForMarket({ market }).catch((error: unknown) => {
      reportError({ context: 'layout.brands', error })
      return false
    }),
    Promise.all(
      slugs.map(async (slug): Promise<BrandNavigationItem | null> => {
        try {
          const brand = await getBrandForMarket({ market, slug })
          return {
            id: brand.id,
            imageUrl: brand.coverPhotoUrl?.trim() || null,
            name: brand.name,
            slug: brand.slug,
          }
        } catch (error) {
          reportError({ context: 'layout.brands.curated', error })
          return null
        }
      }),
    ),
  ])
  const bySlug = new Map(
    entries.flatMap((entry) => (entry ? [[entry.slug, entry] as const] : [])),
  )
  const items = [...new Set(configuration.slugs)].flatMap((slug) => {
    const item = bySlug.get(slug)
    return item ? [item] : []
  })
  const featuredBrand = configuration.featuredSlug
    ? (bySlug.get(configuration.featuredSlug) ?? null)
    : null

  return {
    enabled: hasBrands || items.length > 0 || featuredBrand !== null,
    featuredBrand,
    items,
  }
}
