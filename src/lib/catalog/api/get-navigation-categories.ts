import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { MarketSelectionInput } from '@/lib/market/model/market'

type NavigationCategoriesInput = {
  limit?: number
  market: MarketSelectionInput
}

export const getNavigationCategories = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as NavigationCategoriesInput)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        limit: z.number().int().min(1).max(12).optional(),
        market: marketInputSchema,
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const { getNavigationCategoriesForMarket } =
      await import('./get-navigation-categories.server')

    return getNavigationCategoriesForMarket({
      limit: input.limit,
      market,
    })
  })
