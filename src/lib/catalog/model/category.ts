export type CategorySummary = {
  id: string
  imageUrl: string | null
  name: string
  permalink: string
}

export type CategoryNavigationItem = CategorySummary & {
  children: CategoryNavigationItem[]
}

export type CategoryBreadcrumbItem = {
  id: string
  name: string
  permalink: string
}

export type CategoryDetail = CategorySummary & {
  breadcrumbs: CategoryBreadcrumbItem[]
  description: string
  metaDescription: string | null
  metaTitle: string | null
}
