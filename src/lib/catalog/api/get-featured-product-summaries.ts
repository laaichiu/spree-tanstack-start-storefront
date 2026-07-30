import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/market/model/market'

type FeaturedProductSummariesInput = {
  market: MarketSelectionInput
  limit?: number
}

export const getFeaturedProductSummaries = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as FeaturedProductSummariesInput)
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
    const { getFeaturedProductSummariesForMarket } =
      await import('./get-featured-product-summaries.server')

    return getFeaturedProductSummariesForMarket({
      limit: input.limit ?? 4,
      market: await resolveServerMarket(input.market),
    })
  })
