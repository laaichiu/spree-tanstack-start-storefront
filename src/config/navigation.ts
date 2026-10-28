import type { BrandNavigationConfig } from '@/lib/brands/contracts/brand-navigation'

// Keep the curated order here. The featured image comes from the brand's
// backend cover photo; unavailable brands are omitted from navigation.
export const storefrontBrandNavigation = {
  featuredSlug: 'apple',
  slugs: ['apple'],
} as const satisfies BrandNavigationConfig
