import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/market/model/market'
import { reportError } from '@/lib/observability/report-error'

import type { HomePageModel, HomeSectionStatus } from '../model/home-page'
import type { CategorySummary } from '../model/category'
import type { ProductSummary } from '../model/product'
import { getFeaturedProductSummaries } from './get-featured-product-summaries'
import { getHomeCategorySummaries } from './get-home-category-summaries'

type HomePageInput = {
  market: MarketSelectionInput
}

type HomePageLoaders = {
  loadFeaturedCategories: (input: HomePageInput) => Promise<CategorySummary[]>
  loadFeaturedProducts: (input: HomePageInput) => Promise<ProductSummary[]>
  reportError: typeof reportError
}

const homePageLoaders: HomePageLoaders = {
  loadFeaturedCategories: ({ market }) =>
    getHomeCategorySummaries({ data: { limit: 6, market } }),
  loadFeaturedProducts: ({ market }) =>
    getFeaturedProductSummaries({ data: { limit: 12, market } }),
  reportError,
}

function getSectionStatus(items: unknown[]): HomeSectionStatus {
  return items.length > 0 ? 'ready' : 'empty'
}

export async function loadHomePage(
  input: HomePageInput,
  loaders: HomePageLoaders = homePageLoaders,
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

export const getHomePage = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as HomePageInput)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z.object({ market: marketInputSchema }).parse(data)

    return loadHomePage(input)
  })
