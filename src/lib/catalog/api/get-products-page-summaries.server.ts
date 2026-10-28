import '@tanstack/react-start/server-only'

import { reportError } from '@/lib/observability/report-error'

import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import {
  fromProductListingApiInput,
  toProductListParams,
} from './product-listing-params'
import type { ProductListingApiInput } from './product-listing-params'
import {
  getProductListing,
  getProductListingFilters,
} from './get-product-summaries'

export async function getProductsPageSummariesForMarket({
  market,
  ...input
}: ProductListingApiInput & { market: ResolvedMarket }) {
  const client = getServerSpreeClientForMarket(market)
  const search = fromProductListingApiInput(input)
  const [listing, filters] = await Promise.all([
    getProductListing(client, toProductListParams(search)),
    getProductListingFilters(client, search).catch((error: unknown) => {
      reportError({ context: 'products.list.filters', error })
      return null
    }),
  ])

  return {
    ...listing,
    filters,
  }
}
