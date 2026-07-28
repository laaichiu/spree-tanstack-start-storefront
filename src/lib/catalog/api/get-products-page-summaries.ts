import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { MarketSelectionInput } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  PRODUCT_LISTING_AVAILABILITY_VALUES,
  PRODUCT_LISTING_SORT_VALUES,
} from '@/lib/catalog/model/product-listing'
import {
  fromProductListingApiInput,
  toProductListParams,
} from '@/lib/catalog/api/product-listing-params'
import type { ProductListingApiInput } from '@/lib/catalog/api/product-listing-params'

import {
  getProductListing,
  getProductListingFilters,
} from './get-product-summaries'

type ProductsPageSummariesInput = ProductListingApiInput & {
  market: MarketSelectionInput
}

export const getProductsPageSummaries = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as ProductsPageSummariesInput)
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
        sort: z.enum(PRODUCT_LISTING_SORT_VALUES).optional(),
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const client = getServerSpreeClientForMarket(market)
    const search = fromProductListingApiInput(input)
    const [listing, filters] = await Promise.all([
      getProductListing(client, toProductListParams(search)),
      getProductListingFilters(client, search).catch(() => null),
    ])

    return {
      ...listing,
      filters,
    }
  })
