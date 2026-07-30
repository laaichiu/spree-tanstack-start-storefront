import type { MarketSelectionInput } from '@/lib/market/model/market'
import type { reportError } from '@/lib/observability/report-error'

import type { CategorySummary } from '../model/category'
import type { HomePageModel, HomeSectionStatus } from '../model/home-page'
import type { ProductSummary } from '../model/product'

export type HomePageInput = {
  market: MarketSelectionInput
}

export type HomePageLoaders = {
  loadFeaturedCategories: (input: HomePageInput) => Promise<CategorySummary[]>
  loadFeaturedProducts: (input: HomePageInput) => Promise<ProductSummary[]>
  reportError: typeof reportError
}

function getSectionStatus(items: unknown[]): HomeSectionStatus {
  return items.length > 0 ? 'ready' : 'empty'
}

export async function loadHomePage(
  input: HomePageInput,
  loaders: HomePageLoaders,
): Promise<HomePageModel> {
  const [featuredProducts, featuredCategories] = await Promise.all([
    loaders.loadFeaturedProducts(input).then(
      (products) => ({ products, status: getSectionStatus(products) }),
      (error: unknown) => {
        loaders.reportError({ context: 'home.featuredProducts', error })

        return { products: [], status: 'error' as const }
      },
    ),
    loaders.loadFeaturedCategories(input).then(
      (categories) => ({ categories, status: getSectionStatus(categories) }),
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
