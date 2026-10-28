import '@tanstack/react-start/server-only'

import { reportError } from '@/lib/observability/report-error'

import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import type { BrandProductListingPage } from '@/lib/brands/contracts'
import type { ProductListingSearch } from '@/lib/catalog/contracts'
import {
  getProductListing,
  getProductListingFilters,
} from '@/lib/catalog/api/get-product-summaries'
import { toProductListParams } from '@/lib/catalog/api/product-listing-params'

/**
 * Returns only products assigned to the requested Seller resource.
 *
 * `seller_id_eq` is an official SDK passthrough Ransack predicate and is
 * serialized to `q[seller_id_eq]` by @spree/sdk. Filtering stays in Spree so
 * the storefront never has to load or expose another seller's catalog.
 */
export async function getBrandProductsForMarket({
  market,
  search,
  sellerId,
}: {
  market: ResolvedMarket
  search: ProductListingSearch
  sellerId: string
}): Promise<BrandProductListingPage> {
  const client = getServerSpreeClientForMarket(market)
  const sellerFilter = { seller_id_eq: sellerId }

  const [listing, filters] = await Promise.all([
    getProductListing(
      client,
      toProductListParams(search, { extra: sellerFilter }),
      { includeVariants: true },
    ),
    getProductListingFilters(client, search, { sellerId }).catch(
      (error: unknown) => {
        reportError({ context: 'brands.products.filters', error })
        return null
      },
    ),
  ])

  return { ...listing, filters }
}
