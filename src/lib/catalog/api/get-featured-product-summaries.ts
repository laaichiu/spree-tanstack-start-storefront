import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { MarketSelectionInput } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { getProductSummaries } from './get-product-summaries'

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
    const market = await resolveServerMarket(input.market)

    return getProductSummaries(getServerSpreeClientForMarket(market), {
      limit: input.limit ?? 4,
      sort: 'best_selling',
    })
  })
