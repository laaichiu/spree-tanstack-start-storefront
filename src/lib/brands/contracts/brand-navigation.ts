export type BrandNavigationItem = {
  id: string
  imageUrl: string | null
  name: string
  slug: string
}

export type BrandNavigation = {
  enabled: boolean
  featuredBrand: BrandNavigationItem | null
  items: BrandNavigationItem[]
}

export type BrandNavigationConfig = {
  featuredSlug: string | null
  slugs: readonly string[]
}
