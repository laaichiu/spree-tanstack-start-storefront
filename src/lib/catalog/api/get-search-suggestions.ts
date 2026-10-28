import { createServerFn } from '@tanstack/react-start'

export const getSearchSuggestionProducts = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { getSearchSuggestionProductsForMarket } =
      await import('./get-search-suggestions.server')
    return getSearchSuggestionProductsForMarket(
      await resolveServerMarket(marketInputSchema.parse(data)),
    )
  })

export const getSearchSuggestionCategories = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { getSearchSuggestionCategoriesForMarket } =
      await import('./get-search-suggestions.server')
    return getSearchSuggestionCategoriesForMarket(
      await resolveServerMarket(marketInputSchema.parse(data)),
    )
  })
