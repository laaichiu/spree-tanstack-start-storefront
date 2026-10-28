import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'

import type { MarketSelectionInput, ResolvedMarket } from '@/lib/core/market'
import {
  PRODUCT_LISTING_AVAILABILITY_VALUES,
  PRODUCT_LISTING_SORT_VALUES,
} from '@/lib/catalog/contracts'
import type { ProductListingApiInput } from '@/lib/catalog/api/product-listing-params'

export type CollectionListingInput = ProductListingApiInput & {
  market: MarketSelectionInput
  slug: string
}

type CollectionListingForMarketInput = ProductListingApiInput & {
  market: ResolvedMarket
  slug: string
}

export const getCollectionListing = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        availability: z.enum(PRODUCT_LISTING_AVAILABILITY_VALUES).optional(),
        limit: z.number().int().min(1).max(48).optional(),
        market: marketInputSchema,
        option: z.array(z.string().trim().min(1)).optional(),
        page: z.number().int().min(1).optional(),
        price_max: z.number().nonnegative().optional(),
        price_min: z.number().nonnegative().optional(),
        query: z.string().trim().optional(),
        slug: z.string().trim().min(1),
        sort: z.enum(PRODUCT_LISTING_SORT_VALUES).optional(),
      })
      .parse(data)
    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { getCollectionListingForMarket } =
      await import('./get-collection-listing.server')

    return getCollectionListingForMarket({
      ...input,
      market: await resolveServerMarket(input.market),
    })
  })

export const loadCollectionListingForMarketOnServer = createServerOnlyFn(
  async (input: CollectionListingForMarketInput) => {
    const { getCollectionListingForMarket } =
      await import('./get-collection-listing.server')

    return getCollectionListingForMarket(input)
  },
)
