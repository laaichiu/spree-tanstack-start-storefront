import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/market/model/market'

type HomeCategorySummariesInput = {
  market: MarketSelectionInput
  limit?: number
}

export const getHomeCategorySummaries = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as HomeCategorySummariesInput)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        market: marketInputSchema,
        limit: z.number().int().min(1).max(12).optional(),
      })
      .parse(data)
    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { getHomeCategorySummariesForMarket } =
      await import('./get-home-category-summaries.server')

    return getHomeCategorySummariesForMarket({
      limit: input.limit ?? 6,
      market: await resolveServerMarket(input.market),
    })
  })
