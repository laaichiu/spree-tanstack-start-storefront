import type { CatalogCategoryReference } from './category'
import type { ProductSummary } from './product'

export type HomeSectionStatus = 'ready' | 'empty' | 'error'

export type HomeFeaturedProductsModel = {
  products: ProductSummary[]
  status: HomeSectionStatus
}

export type HomeFeaturedCategoriesModel = {
  categories: CatalogCategoryReference[]
  status: HomeSectionStatus
}

export type HomePageModel = {
  featuredCategories: HomeFeaturedCategoriesModel
  featuredProducts: HomeFeaturedProductsModel
}

export function getHomeSectionStatus(items: readonly unknown[]) {
  return items.length > 0 ? ('ready' as const) : ('empty' as const)
}
