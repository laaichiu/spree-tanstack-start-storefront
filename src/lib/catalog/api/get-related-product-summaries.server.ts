import '@tanstack/react-start/server-only'

import { selectRelatedProductSummaries } from '@/lib/catalog/contracts'
import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { getProductSummaries } from './get-product-summaries'

const DEFAULT_RELATED_PRODUCT_LIMIT = 4

export async function getRelatedProductSummariesForMarket({
  categoryId,
  currentProductId,
  limit = DEFAULT_RELATED_PRODUCT_LIMIT,
  market,
}: {
  categoryId: string
  currentProductId: string
  limit?: number
  market: ResolvedMarket
}) {
  const products = await getProductSummaries(
    getServerSpreeClientForMarket(market),
    {
      in_category: categoryId,
      limit: limit + 1,
    },
    { includeVariants: true },
  )

  return selectRelatedProductSummaries({
    currentProductId,
    limit,
    products,
  })
}
