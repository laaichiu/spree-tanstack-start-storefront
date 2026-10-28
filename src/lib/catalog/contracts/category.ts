/**
 * Stable category identity and artwork used by catalog page composition.
 * Navigation and category-detail metadata stay on their owning contracts.
 */
export type CatalogCategoryReference = {
  id: string
  imageUrl: string | null
  name: string
  permalink: string
}

export type CategoryNavigationItem = CatalogCategoryReference & {
  children: CategoryNavigationItem[]
}

export type CategoryBreadcrumbItem = {
  id: string
  name: string
  permalink: string
}

export type CategoryDetail = CatalogCategoryReference & {
  breadcrumbs: CategoryBreadcrumbItem[]
  description: string
  metaDescription: string | null
  metaTitle: string | null
}
