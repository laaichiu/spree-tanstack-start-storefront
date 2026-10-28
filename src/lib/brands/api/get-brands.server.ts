import '@tanstack/react-start/server-only'

import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { assertCatalogListResponse } from '@/lib/catalog/utils/catalog-list-response'
import { assertCatalogPaginationPageCount } from '@/lib/catalog/utils/catalog-pagination-response'

import type { BrandProfile } from '@/lib/brands/contracts'
import { mapSpreeSellerToBrand } from '@/lib/brands/mappers/brand.mapper'
import {
  assertSpreeSellerResource,
  assertSpreeSellerSlugMatchesRequestedSlug,
} from '@/lib/brands/mappers/brand-response'

const BRAND_PAGE_SIZE = 100
const MAX_BRAND_PAGES = 50

export async function getBrandsForMarket({
  market,
}: {
  market: ResolvedMarket
}): Promise<BrandProfile[]> {
  const client = getServerSpreeClientForMarket(market)
  const brands: BrandProfile[] = []
  let page = 1
  let pages = 1

  do {
    const response = await client.sellers.list({
      limit: BRAND_PAGE_SIZE,
      page,
    })
    assertCatalogListResponse(response)
    assertCatalogPaginationPageCount(response.meta)
    response.data.forEach(assertSpreeSellerResource)
    brands.push(...response.data.map(mapSpreeSellerToBrand))
    pages = response.meta.pages
    page += 1
  } while (page <= pages && page <= MAX_BRAND_PAGES)

  return brands
}

export async function hasBrandsForMarket({
  market,
}: {
  market: ResolvedMarket
}) {
  const response = await getServerSpreeClientForMarket(market).sellers.list({
    limit: 1,
    page: 1,
  })
  assertCatalogListResponse(response)
  response.data.forEach(assertSpreeSellerResource)
  return response.data.length > 0
}

export async function getBrandForMarket({
  market,
  slug,
}: {
  market: ResolvedMarket
  slug: string
}) {
  const seller = await getServerSpreeClientForMarket(market).sellers.get(slug)
  assertSpreeSellerResource(seller)
  assertSpreeSellerSlugMatchesRequestedSlug(seller, slug)
  return mapSpreeSellerToBrand(seller)
}
