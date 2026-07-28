import type { CategorySummary } from './category'
import type { ProductSummary } from './product'

export type HomeSectionStatus = 'ready' | 'empty' | 'error'

export type HomeFeaturedProductsModel = {
  products: ProductSummary[]
  status: HomeSectionStatus
}

export type HomeFeaturedCategoriesModel = {
  categories: CategorySummary[]
  status: HomeSectionStatus
}

export type HomePageModel = {
  featuredCategories: HomeFeaturedCategoriesModel
  featuredProducts: HomeFeaturedProductsModel
}
