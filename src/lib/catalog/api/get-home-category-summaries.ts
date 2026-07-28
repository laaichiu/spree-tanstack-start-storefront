import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { MarketSelectionInput } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeCategoriesToHomeSummaries } from '../mappers/category.mapper'

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
    const market = await resolveServerMarket(input.market)
    const response = await getServerSpreeClientForMarket(
      market,
    ).categories.list({
      limit: 48,
    })

    return mapSpreeCategoriesToHomeSummaries(response.data, input.limit ?? 6)
  })
