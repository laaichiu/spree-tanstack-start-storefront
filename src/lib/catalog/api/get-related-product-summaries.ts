import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { MarketSelectionInput } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { selectRelatedProductSummaries } from '../utils/related-products'
import { getProductSummaries } from './get-product-summaries'

const DEFAULT_RELATED_PRODUCT_LIMIT = 4

type RelatedProductSummariesInput = {
  categoryId: string
  currentProductId: string
  market: MarketSelectionInput
  limit?: number
}

export const getRelatedProductSummaries = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as RelatedProductSummariesInput)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        categoryId: z.string().trim().min(1),
        currentProductId: z.string().trim().min(1),
        market: marketInputSchema,
        limit: z.number().int().min(1).max(8).optional(),
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const limit = input.limit ?? DEFAULT_RELATED_PRODUCT_LIMIT
    const products = await getProductSummaries(
      getServerSpreeClientForMarket(market),
      {
        in_category: input.categoryId,
        limit: limit + 1,
      },
    )

    return selectRelatedProductSummaries({
      currentProductId: input.currentProductId,
      limit,
      products,
    })
  })
