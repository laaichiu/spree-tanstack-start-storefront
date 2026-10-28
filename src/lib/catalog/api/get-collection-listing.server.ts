import '@tanstack/react-start/server-only'

import { reportError } from '@/lib/observability/report-error'

import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  getProductListing,
  getProductListingFilters,
} from './get-product-summaries'

import {
  fromProductListingApiInput,
  toProductListParams,
} from './product-listing-params'
import type { ProductListingApiInput } from './product-listing-params'
import { mapSpreeCategoryToDetail } from '../mappers/category.mapper'
import {
  assertCatalogCategoryResourceMatchesRequestedId,
  assertCatalogCategoryTreeResourceIsCategory,
} from '../utils/catalog-resource-identity'

export async function getCollectionListingForMarket({
  market,
  slug,
  ...input
}: ProductListingApiInput & {
  market: ResolvedMarket
  slug: string
}) {
  const client = getServerSpreeClientForMarket(market)
  const category = await client.categories.get(slug, {
    expand: ['ancestors', 'children'],
  })
  assertCatalogCategoryTreeResourceIsCategory(category)
  assertCatalogCategoryResourceMatchesRequestedId(category, slug)
  const search = fromProductListingApiInput(input)

  const [listing, filters] = await Promise.all([
    getProductListing(
      client,
      toProductListParams(search, {
        extra: {
          in_category: category.id,
        },
      }),
    ),
    getProductListingFilters(client, search, {
      categoryId: category.id,
    }).catch((error: unknown) => {
      reportError({ context: 'products.collection.filters', error })
      return null
    }),
  ])

  return {
    category: mapSpreeCategoryToDetail(category),
    filters,
    ...listing,
  }
}
