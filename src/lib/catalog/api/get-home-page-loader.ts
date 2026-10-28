import type { MarketSelectionInput } from '@/lib/core/market'
import type { reportError } from '@/lib/observability/report-error'

import type {
  CatalogCategoryReference,
  HomePageModel,
  ProductSummary,
} from '@/lib/catalog/contracts'
import { getHomeSectionStatus } from '@/lib/catalog/contracts'

export type HomePageInput = {
  market: MarketSelectionInput
}

export type HomePageLoaders = {
  loadFeaturedCategories: (
    input: HomePageInput,
  ) => Promise<CatalogCategoryReference[]>
  loadFeaturedProducts: (input: HomePageInput) => Promise<ProductSummary[]>
  reportError: typeof reportError
}

export async function loadHomePage(
  input: HomePageInput,
  loaders: HomePageLoaders,
): Promise<HomePageModel> {
  const [featuredProducts, featuredCategories] = await Promise.all([
    loaders.loadFeaturedProducts(input).then(
      (products) => ({ products, status: getHomeSectionStatus(products) }),
      (error: unknown) => {
        loaders.reportError({ context: 'home.featuredProducts', error })

        return { products: [], status: 'error' as const }
      },
    ),
    loaders.loadFeaturedCategories(input).then(
      (categories) => ({
        categories,
        status: getHomeSectionStatus(categories),
      }),
      (error: unknown) => {
        loaders.reportError({ context: 'home.categories', error })

        return { categories: [], status: 'error' as const }
      },
    ),
  ])

  return {
    featuredCategories,
    featuredProducts,
  }
}
